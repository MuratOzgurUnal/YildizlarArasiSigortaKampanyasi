// api/config.js - CommonJS formatı ile yeniden yazıldı

// module.exports kullanarak fonksiyonu dışarı aktarıyoruz
module.exports = (request, response) => {
    // API anahtarlarını process.env'den okuyoruz
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
  
    // Hata ayıklama için terminale log basıyoruz
    console.log("--- SUNUCU TARAFI KONTROL ---");
    console.log("GOOGLE_API_KEY bulundu mu?", googleApiKey ? 'EVET' : 'HAYIR');
    console.log("GEMINI_API_KEY bulundu mu?", geminiApiKey ? 'EVET' : 'HAYIR');
    console.log("----------------------------");
  
    // Eğer anahtarlardan biri bile eksikse, 500 hatası ve açıklayıcı bir mesaj döndür
    if (!googleApiKey || !geminiApiKey) {
      return response.status(500).json({
        error: "API anahtarları sunucu ortamında bulunamadı.",
        message: "Lütfen .env.development.local dosyasının projenin ana klasöründe olduğundan ve 'vercel dev' komutunu yeniden başlattığınızdan emin olun."
      });
    }
  
    // Her şey yolundaysa, anahtarları JSON olarak tarayıcıya gönder
    response.status(200).json({
      googleApiKey,
      geminiApiKey,
    });
  };