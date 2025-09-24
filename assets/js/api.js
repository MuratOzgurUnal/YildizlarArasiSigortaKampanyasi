// assets/js/api.js

// =================================================================
// API ANAHTARLARI VE YAPILANDIRMA
// =================================================================

// Önce anahtarları sunucudan güvenli bir şekilde çekmek için bir fonksiyon yazıyoruz.
async function getApiKeys() {
    try {
        // Vercel'de oluşturduğumuz sunucusuz fonksiyona istek atıyoruz.
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('API anahtarları alınamadı.');
        }
        return await response.json();
    } catch (error) {
        console.error('API anahtarları yüklenirken hata:', error);
        // Anahtarlar yüklenemezse null döndürerek diğer fonksiyonların hata vermesini sağlıyoruz.
        return null; 
    }
}

// GOOGLE SHEETS DOKÜMAN ID'NİZİ BURAYA GİRİN.
const SPREADSHEET_ID = '1Y-3f2a3x6rySezzKJeFmddC-_bL7sHX_riRvv0LPiU8';

// =================================================================
// GOOGLE SHEETS VERİ ÇEKME FONKSİYONU
// =================================================================
export async function fetchGoogleSheetData(sheetName) {
    const keys = await getApiKeys();
    if (!keys) throw new Error("API anahtarları eksik.");

    const GOOGLE_SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/`;
    const url = `${GOOGLE_SHEETS_BASE_URL}${sheetName}?key=${keys.googleApiKey}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Sheets API Hatası: ${response.status}`);
        }
        const data = await response.json();
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        return rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });
            return rowData;
        });
    } catch (error) {
        console.error('Google Sheets verisi çekilirken hata:', error);
        throw error;
    }
}

// =================================================================
// GOOGLE GEMINI VERİ ÇEKME FONKSİYONU
// =================================================================
export async function fetchGeminiData(prompt) {
    const keys = await getApiKeys();
    if (!keys) throw new Error("API anahtarları eksik.");
    
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${keys.geminiApiKey}`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Hatası: ${response.status}`);
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Gemini verisi çekilirken hata:', error);
        throw error;
    }
}