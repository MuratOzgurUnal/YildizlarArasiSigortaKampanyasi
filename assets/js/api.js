// assets/js/api.js - %100 GİZLİ VERCEL VERSİYONU

const SPREADSHEET_ID = '1NM4J06fa6Y-WEHGhKCSj3UaoeEU0kzH56_FxHYQwOJQ';

// 1. Google Sheets Veri Çekme Fonksiyonu
export async function fetchGoogleSheetData(sheetName) {
    try {
        // Vercel kasasından Google şifresini çekiyoruz
        const configResponse = await fetch('/api/config');
        const configData = await configResponse.json();

        if (!configData.googleApiKey) {
            throw new Error("Google API anahtarı Vercel kasasında bulunamadı.");
        }

        const GOOGLE_SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/`;
        const url = `${GOOGLE_SHEETS_BASE_URL}${encodeURIComponent(sheetName)}?key=${configData.googleApiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Sayfa bulunamadı veya API erişim izni yok.");
        
        const sheetVerisi = await response.json();
        
        if (!sheetVerisi.values || sheetVerisi.values.length === 0) return [];
        const headers = sheetVerisi.values[0].map(header => header.trim());
        const rows = sheetVerisi.values.slice(1);
        
        return rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index] ? row[index].trim() : '';
            });
            return rowData;
        });
    } catch (error) {
        console.error("Google verisi çekilirken hata:", error);
        throw error;
    }
}

// 2. İhtimalsizlik Motoru (Gemini) Veri Çekme Fonksiyonu
export async function fetchGeminiData(prompt) {
    try {
        // Vercel kasasından Gemini şifresini çekiyoruz
        const configResponse = await fetch('/api/config');
        const configData = await configResponse.json();

        if (!configData.geminiApiKey) {
            return "Motor şu an yakıtsız kaldı. Vercel kasasına ulaşılamıyor.";
        }

        const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${configData.geminiApiKey}`;
        
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Hatası: ${errorData.error?.message || 'Bilinmeyen hata'}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
        
    } catch (error) {
        console.error("İhtimalsizlik Motoru çalışırken bir sorunla karşılaştı:", error);
        throw error;
    }
}