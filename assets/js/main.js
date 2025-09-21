// =================================================================
// YARDIMCI FONKSİYONLARI
// =================================================================
function getLogoUrl(branchName) {
    if (!branchName) return '';
    const sanitizedName = branchName.toLowerCase().replace(/ şubesi/g, '').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/\s+/g, '-');
    return `./assets/images/logos/${sanitizedName}.svg`;
}

function displayError(container, message = "Veriler yüklenemedi. Bağlantı Başarısız!") {
    if (container) container.innerHTML = `<p class="error-message">${message}</p>`;
}

// =================================================================
// HAFTALIK HABERLERİ YÜKLEME FONKSİYONU
// =================================================================
async function loadWeeklyNews() {
    const newsContainer = document.getElementById('news-content-area');
    if (!newsContainer) return;

    try {
        const response = await fetch('haberler.html');
        if (!response.ok) {
            throw new Error('Haberler dosyası bulunamadı.');
        }
        const newsHtml = await response.text();
        newsContainer.innerHTML = newsHtml;
    } catch (error) {
        console.error('Haberler yüklenirken hata oluştu:', error);
        displayError(newsContainer, 'Haberler yüklenemedi.');
    }
}

// =================================================================
// RENDER FONKSİYONLARI
// =================================================================
function renderStandings(data) {
    const standingsBody = document.getElementById('standings-body');
    if (!standingsBody) return;
    standingsBody.innerHTML = '';
    data.sort((a, b) => parseInt(b.Puan) - parseInt(a.Puan)).forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${index + 1}</td><td class="branch-cell"><img src="${getLogoUrl(team.SubeAdi)}" class="branch-logo" alt="${team.SubeAdi}" onerror="this.style.display='none'"><span>${team.SubeAdi}</span></td><td>${team.Oynanan}</td><td>${team.Galibiyet}</td><td>${team.Beraberlik}</td><td>${team.Maglubiyet}</td><td>${team.Puan}</td>`;
        standingsBody.appendChild(row);
    });
}

function renderBranchGroups(data) {
    const branchGroupsList = document.getElementById('branch-groups-list');
    if (!branchGroupsList) return;
    branchGroupsList.innerHTML = '';
    const groups = data.reduce((acc, item) => {
        const group = item.HedefGrubu || 'Diğer';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item.SubeAdi);
        return acc;
    }, {});
    Object.keys(groups).sort().forEach(groupName => {
        const groupContainer = document.createElement('div');
        groupContainer.className = 'group-container';
        const branchesHtml = groups[groupName].map(branchName => `<li><img src="${getLogoUrl(branchName)}" class="branch-logo" alt="${branchName}" onerror="this.style.display='none'"><span>${branchName}</span></li>`).join('');
        groupContainer.innerHTML = `<h3 class="group-title">${groupName}</h3><ul class="group-list">${branchesHtml}</ul>`;
        branchGroupsList.appendChild(groupContainer);
    });
}

function renderAllFixtures(data) {
    const fixturesByWeekList = document.getElementById('fixtures-by-week-list');
    if (!fixturesByWeekList) return;
    fixturesByWeekList.innerHTML = '';
    const weeks = data.reduce((acc, item) => {
        const week = `Hafta ${item.Hafta}`;
        if (!acc[week]) acc[week] = [];
        acc[week].push(item);
        return acc;
    }, {});
    Object.keys(weeks).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1])).forEach(weekName => {
        const weekContainer = document.createElement('div');
        weekContainer.className = 'week-container';
        const matchesHtml = weeks[weekName].map(match => {
            const scoreA = match.EvSahibiSkor || '-';
            const scoreB = match.DeplasmanSkor || '-';
            return `<div class="match-row" data-teams="${match.EvSahibi.toLowerCase()} ${match.Deplasman.toLowerCase()}"><span class="team home"><img src="${getLogoUrl(match.EvSahibi)}" class="branch-logo" alt="${match.EvSahibi}" onerror="this.style.display='none'"><span>${match.EvSahibi}</span></span><div class="score-info-fixture"><span class="score">${scoreA}</span><span class="vs-separator-fixture">:</span><span class="score">${scoreB}</span></div><span class="team away"><img src="${getLogoUrl(match.Deplasman)}" class="branch-logo" alt="${match.Deplasman}" onerror="this.style.display='none'"><span>${match.Deplasman}</span></span></div>`;
        }).join('');
        weekContainer.innerHTML = `<h3 class="week-title">${weekName}</h3>${matchesHtml}`;
        fixturesByWeekList.appendChild(weekContainer);
    });
}

// =================================================================
// SAYFA BAŞLATMA FONKSİYONLARI
// =================================================================
function initIndexPage() {
    loadWeeklyNews();
    fetchGoogleSheetData('PuanDurumu!A1:G').then(renderStandings).catch(() => displayError(document.getElementById('standings-container')));
}

function initKlasmanPage() {
    fetchGoogleSheetData('SubeKlasmanlari!A1:B').then(renderBranchGroups).catch(() => displayError(document.getElementById('branch-groups-container')));
}

function initFiksturPage() {
    fetchGoogleSheetData('Fikstur!A1:E').then(data => {
        renderAllFixtures(data);
        const searchInput = document.getElementById('fixture-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('.match-row').forEach(match => {
                    const displayStyle = match.dataset.teams.includes(searchTerm) ? 'grid' : 'none';
                    match.style.display = displayStyle;
                });
            });
        }
    }).catch(() => displayError(document.getElementById('fixtures-page-container')));
}

// =================================================================
// SONSUZ İHTİMALSİZLİK MOTORU MANTIĞI
// =================================================================
const improbabilityButton = document.getElementById('improbability-button');
if (improbabilityButton) {
    improbabilityButton.addEventListener('click', async () => {
        const userName = prompt("Lütfen motorun analiz etmesi için bir İsim Soyisim girin:");
        if (!userName || userName.trim() === "") {
            alert("İsim Soyisim girmek zorunludur.");
            return;
        }

        const responseArea = document.getElementById('improbability-response');
        responseArea.innerHTML = '<div class="loader"></div><p>İhtimaller hesaplanıyor, kuantum köpükler karıştırılıyor...</p>';
        improbabilityButton.disabled = true;
        
        // --- PROMPT GÜNCELLENDİ (Antalya Temalı, Daha Eğlenceli ve Basit Dil) ---
        const promptText = `YAPAY ZEKA ROLÜ: Sen, Douglas Adams'ın "Otostopçunun Galaksi Rehberi" tarzında yazan, esprili ve absürt bir yapay zekasın. Görevin, verilen bir isim için, birbiriyle alakasız kozmik olayları ve sıradan nesneleri birleştirerek, o kişi hakkında inanılmaz derecede ihtimal dışı, komik ve övgü dolu bir "gerçek" senaryo üretmektir.
        KURALLAR:
        1.  Dilin basit, komik ve herkesin anlayacağı türden olsun. Bilimsel terimler kullanma.
        2.  Her senaryo mutlaka üç temel unsuru birleştirmeli:
            a) Antalya'ya özgü bir şey (Örn: Konyaaltı sahili, Düden Şelalesi, Yivli Minare, 'yanıyoruz' lafı, falezler, piyaz, nem).
            b) Bir sigorta veya bankacılık ürünü (Örn: KASKO, Tamamlayıcı Sağlık, Bireysel Emeklilik, Elementer Sigortası, Hayat Sigortası, Yuvam Sigortası,  ).
            c) Bu ikisinin birleşimiyle ortaya çıkan absürt bir sonuç.
        3.  Her seferinde tamamen farklı bir bağlantı kur. Maksimum eğlence ve saçmalık hedefin olsun.
        4.  Sonuç, kişiyi veya şubesini komik bir şekilde övmeli.
        5.  Sadece ürettiğin senaryoyu yaz.
        
        ÖRNEK SENARYO: "Yapılan son 'nem ölçer' analizlerine göre, [İSİM]'in müşterisine 'Yuvam Sigortası' poliçesini anlatırken sergilediği sıcak ve samimi tavır, odadaki nem oranını %3 düşürmüştür. Bu durum, Antalya'daki genel 'yapış yapış hissetme' katsayısını anlık olarak iyileştirdiği için kendisine belediye tarafından gizli bir 'İklim Düzenleme Kahramanı' madalyası takılmıştır."
        
        GÖREV: Aşağıdaki isim için bu kurallara uygun bir senaryo üret.
        
        İSİM: ${userName}`;

        try {
            const result = await fetchGeminiData(promptText);
            responseArea.innerHTML = `<p>"${result.trim()}"</p>`;
        } catch (error) {
            console.error("Gemini Hatası Detayı:", error);
            responseArea.innerHTML = `<p class="error-message">İhtimaller, bir fincan çayın aniden varoluştan silinmesiyle sonuçlandı. API anahtarınızı veya Gemini güvenlik ayarlarını kontrol edin.</p>`;
        } finally {
            improbabilityButton.disabled = false;
        }
    });
}

// =================================================================
// AÇILIR PENCERE (MODAL) MANTIĞI - DİNAMİK İÇERİKLİ
// =================================================================
let isModalContentLoaded = false;

function initModal() {
    const modal = document.getElementById('improbability-modal');
    const openBtn = document.getElementById('what-is-it-button');
    const closeBtn = document.querySelector('.modal-close-button');
    const modalBody = document.getElementById('modal-body-content');

    if (!modal || !openBtn || !closeBtn || !modalBody) return;

    async function loadModalContent() {
        if (isModalContentLoaded) return;
        modalBody.innerHTML = '<div class="loader"></div>';
        try {
            const response = await fetch('ihtimalsizlik-nedir.html');
            if (!response.ok) throw new Error('İçerik dosyası bulunamadı.');
            const contentHtml = await response.text();
            modalBody.innerHTML = contentHtml;
            isModalContentLoaded = true;
        } catch (error) {
            console.error("Modal içeriği yüklenirken hata:", error);
            modalBody.innerHTML = '<p class="error-message">Açıklama içeriği yüklenirken bir sorun oluştu.</p>';
        }
    }

    openBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        modal.classList.add('modal-visible');
        await loadModalContent();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('modal-visible');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('modal-visible');
        }
    });
}

// =================================================================
// UYGULAMA BAŞLANGIÇ NOKTASI
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    initModal();
    
    if (document.getElementById('standings-body')) initIndexPage();
    if (document.getElementById('branch-groups-list')) initKlasmanPage();
    if (document.getElementById('fixtures-by-week-list')) initFiksturPage();
});