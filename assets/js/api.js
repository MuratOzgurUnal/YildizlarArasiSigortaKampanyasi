// assets/js/api.js - GEMINI 3.5 FLASH LITE VERSİYONU

// 1. Google Sheets Anahtarı
const GOOGLE_API_KEY = 'AIzaSyBVYEiJeU9ZtWW7VHvDgXnKJJx0dhhd2oM'; 

// 2. Gemini Anahtarı (Buraya kendi anahtarını yapıştır)
const GEMINI_API_KEY = 'AIzaSyBixdZvEPcDKZ5rjOMxFva1fIUxRdApQ_0'; 

const SPREADSHEET_ID = '1NM4J06fa6Y-WEHGhKCSj3UaoeEU0kzH56_FxHYQwOJQ';

export async function fetchGoogleSheetData(sheetName) {
    const GOOGLE_SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/`;
    const url = `${GOOGLE_SHEETS_BASE_URL}${encodeURIComponent(sheetName)}?key=${GOOGLE_API_KEY}`;
    
    try {
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

export async function fetchGeminiData(prompt) {
    if (!GEMINI_API_KEY || !GEMINI_API_KEY.startsWith('AIza')) {
        console.warn("Geçerli bir Gemini API anahtarı bulunamadı.");
        return "Motor şu an yakıtsız kaldı. Lütfen api.js dosyasına geçerli bir Gemini API anahtarı ekleyin.";
    }

    // GÜNCELLEME: Senin seçtiğin 'gemini-3.5-flash-lite' modeli eklendi
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Detaylı Hata Raporu:", errorData);
            throw new Error(`Gemini API Hatası: ${errorData.error?.message || 'Bilinmeyen hata'}`);
        }
        
        const aiVerisi = await response.json();
        return aiVerisi.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini motoru çalışırken bir sorunla karşılaştı:", error);
        throw error;
    }
}