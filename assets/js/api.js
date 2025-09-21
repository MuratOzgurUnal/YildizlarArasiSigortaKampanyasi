// =================================================================
// API ANAHTARLARI VE YAPILANDIRMA
// =================================================================

// Anahtarlar artık güvenli olan ve GitHub'a gönderilmeyen config.js dosyasından okunuyor.
import { GOOGLE_API_KEY, GEMINI_API_KEY } from './config.js';

// GOOGLE SHEETS DOKÜMAN ID'NİZİ BURAYA GİRİN.
const SPREADSHEET_ID = '1Y-3f2a3x6rySezzKJeFmddC-_bL7sHX_riRvv0LPiU8';

const GOOGLE_SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/`;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;


// =================================================================
// GOOGLE SHEETS VERİ ÇEKME FONKSİYONU
// =================================================================
/**
 * Belirtilen Google Sheet sayfasından verileri çeker.
 * @param {string} sheetName - Veri çekilecek sayfanın adı (Örn: 'PuanDurumu!A2:F').
 * @returns {Promise<Array<Object>>} - İşlenmiş veri dizisi.
 */
async function fetchGoogleSheetData(sheetName) {
    const url = `${GOOGLE_SHEETS_BASE_URL}${sheetName}?key=${GOOGLE_API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Google Sheets API Hatası: ${response.status}`);
        }
        const data = await response.json();
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        // Veriyi daha kullanışlı bir obje dizisine dönüştürür.
        return rows.map(row => {
            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = row[index];
            });
            return rowData;
        });
    } catch (error) {
        console.error('Google Sheets verisi çekilirken hata:', error);
        throw error; // Hatanın üst katmanda yakalanması için tekrar fırlatılır.
    }
}

// =================================================================
// GOOGLE GEMINI VERİ ÇEKME FONKSİYONU
// =================================================================
/**
 * Google Gemini API'ye istek göndererek metin üretir.
 * @param {string} prompt - Gemini'ye gönderilecek metin istemi.
 * @returns {Promise<string>} - Üretilen metin.
 */
async function fetchGeminiData(prompt) {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
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