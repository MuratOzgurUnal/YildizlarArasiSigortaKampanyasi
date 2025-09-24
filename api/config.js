// api/config.js - Son ve temiz hali

module.exports = (request, response) => {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
  
    if (!googleApiKey || !geminiApiKey) {
      // Anahtarlar bulunamazsa bir hata gönder
      return response.status(500).json({
        error: "Sunucu tarafında ortam değişkenleri (API anahtarları) eksik."
      });
    }
  
    // Anahtarları gönder
    response.status(200).json({
      googleApiKey,
      geminiApiKey,
    });
  };