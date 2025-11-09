// assets/js/main.js - SAAT DİLİMİ (TIMEZONE) SORUNU GİDERİLMİŞ NİHAİ VERSİYON

import { fetchGoogleSheetData, fetchGeminiData } from './api.js';

// =================================================================
// YARDIMCI FONKSİYONLAR
// =================================================================
function getLogoUrl(branchName) {
    if (!branchName) return '';
    const sanitizedName = (branchName || '').toLowerCase().replace(/ şubesi/g, '').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/\s+/g, '-');
    return `./assets/images/logos/${sanitizedName}.svg`;
}

function displayError(container, message = "Veriler yüklenemedi. Bağlantı, paylaşım ayarları veya veri formatını kontrol edin.") {
    if (container) container.innerHTML = `<p class="error-message">${message}</p>`;
}

// =================================================================
// HAFTALIK HABERLERİ YÜKLEME FONKSİYONU
// =================================================================
async function loadWeeklyNews() {
    const newsContainer = document.getElementById('news-content-area');
    const matchupsContainer = document.getElementById('weekly-matchups-card');

    if (newsContainer) {
        try {
            const response = await fetch('haberler.html');
            if (!response.ok) throw new Error('Haberler dosyası bulunamadı.');
            newsContainer.innerHTML = await response.text();
        } catch (error) { console.error('Haberler yüklenirken hata oluştu:', error); displayError(newsContainer, 'Haberler yüklenemedi.'); }
    }
    if (matchupsContainer) { loadWeeklyMatchups(matchupsContainer); }
}

// =================================================================
// HAFTANIN KARŞILAŞMALARI BÖLÜMÜ - KESİN ÇÖZÜM
// =================================================================
function getCurrentCampaignWeek() {
    // --- SAAT DİLİMİ SORUNUNU GİDEREN YENİ MANTIK ---
    
    // 1. Tüm tarihleri evrensel saat dilimine (UTC) göre tanımlıyoruz.
    const startDate = new Date(Date.UTC(2025, 9, 6)); // 6 Ekim 2025 (aylar 0'dan başlar, 9=Ekim)
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    // 2. Kampanya başlamadıysa 1. haftayı göster.
    if (todayUTC < startDate) {
        return 1;
    }

    // 3. İki UTC tarihi arasındaki farkı milisaniye olarak alıyoruz.
    const diffTime = todayUTC - startDate;
    
    // 4. Farkı gün sayısına çeviriyoruz.
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 5. Geçen gün sayısına göre hangi takvim haftasında olduğumuzu buluyoruz.
    const currentCalendarWeek = Math.floor(diffDays / 7) + 1;

    // 6. Bugünün gününü UTC'ye göre alıyoruz (Pazar=0, Pazartesi=1, ...)
    const dayOfWeek = today.getUTCDay();
    
    let weekToShow;

    // 7. KURAL: Pazartesi günleri bir önceki haftayı, diğer günler mevcut haftayı göster.
    if (dayOfWeek === 1) { // Eğer bugün Pazartesi ise
        weekToShow = currentCalendarWeek - 1;
    } else { // Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar
        weekToShow = currentCalendarWeek;
    }

    // 8. Güvenlik kontrolleri
    if (weekToShow < 1) weekToShow = 1;
    if (weekToShow > 12) weekToShow = 12;

    return weekToShow;
}


function formatMatchups(matches, allBranchData) {
    return matches.filter(match => match && match.EvSahibi && match.Deplasman).map(match => {
        const teamA = allBranchData.find(branch => branch && branch.SubeAdi === match.EvSahibi);
        const teamB = allBranchData.find(branch => branch && branch.SubeAdi === match.Deplasman);
        if (!teamA || !teamB) return '';
        const teamA_details = `data-saglik="${teamA.Saglik || 0}" data-hayat="${teamA.Hayat || 0}" data-elementer="${teamA.Elementer || 0}" data-besciro="${teamA.BESCiro || 0}" data-besadet="${teamA.BESAdet || 0}" data-bonusadet="${teamA.BONUSAdet || 0}"`;
        const teamB_details = `data-saglik="${teamB.Saglik || 0}" data-hayat="${teamB.Hayat || 0}" data-elementer="${teamB.Elementer || 0}" data-besciro="${teamB.BESCiro || 0}" data-besadet="${teamB.BESAdet || 0}" data-bonusadet="${teamB.BONUSAdet || 0}"`;
        return `<div class="matchup-item"><div class="matchup-team team-a"><img src="${getLogoUrl(teamA.SubeAdi)}" class="matchup-team-logo" alt="${teamA.SubeAdi}" onerror="this.style.display='none'"><span class="matchup-team-name">${teamA.SubeAdi}</span><div class="matchup-main-score clickable-score" ${teamA_details}>${teamA.Puan || 0}</div></div><div class="matchup-vs-graphic">VS</div><div class="matchup-team team-b"><img src="${getLogoUrl(teamB.SubeAdi)}" class="matchup-team-logo" alt="${teamB.SubeAdi}" onerror="this.style.display='none'"><span class="matchup-team-name">${teamB.SubeAdi}</span><div class="matchup-main-score clickable-score" ${teamB_details}>${teamB.Puan || 0}</div></div></div>`;
    }).join('');
}

async function loadWeeklyMatchups(container) {
    let contentArea;
    try {
        const response = await fetch('karsilasmalar.html');
        if (!response.ok) throw new Error(`karsilasmalar.html dosyası bulunamadı.`);
        container.innerHTML = await response.text();
        contentArea = container.querySelector('#weekly-matchups-content');
        if (!contentArea) throw new Error('#weekly-matchups-content alanı bulunamadı.');
        contentArea.innerHTML = '<div class="loader"></div>';

        const [fixturesData, allBranchData] = await Promise.all([ fetchGoogleSheetData('Fikstur!A1:I'), fetchGoogleSheetData('Karsilasmalar!A1:H') ]);
        const validFixtures = fixturesData.filter(f => f && f.Hafta);
        const validBranchData = allBranchData.filter(b => b && b.SubeAdi);
        const weekToDisplay = getCurrentCampaignWeek();
        
        const weeklyFixtures = validFixtures.filter(f => parseInt(f.Hafta) === weekToDisplay);
        contentArea.innerHTML = formatMatchups(weeklyFixtures, validBranchData) || '<p>Bu hafta için karşılaşma bulunamadı.</p>';
        attachScoreTooltipListener();
    } catch (error) {
        console.error('Haftanın karşılaşmaları yüklenirken hata:', error);
        if (container) container.innerHTML = `<p class="error-message">Karşılaşmalar yüklenemedi.</p>`;
    }
}

function attachScoreTooltipListener() {
    document.querySelectorAll('.clickable-score').forEach(scoreElement => {
        scoreElement.addEventListener('click', (event) => {
            removeExistingTooltip();
            const element = event.currentTarget;
            const rect = element.getBoundingClientRect();
            const details = element.dataset;
            const tooltip = document.createElement('div');
            tooltip.className = 'score-tooltip';
            tooltip.innerHTML = `<h4>Puan Dökümü</h4><ul><li><span>Sağlık:</span> <strong>${details.saglik}</strong></li><li><span>Hayat:</span> <strong>${details.hayat}</strong></li><li><span>Elementer:</span> <strong>${details.elementer}</strong></li><li><span>BES Ciro:</span> <strong>${details.besciro}</strong></li><li><span>BES Adet:</span> <strong>${details.besadet}</strong></li><li><span>Bireysel Bonus:</span> <strong>${details.bonusadet}</strong></li></ul>`;
            document.body.appendChild(tooltip);
            tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
            tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
            setTimeout(() => { document.addEventListener('click', closeTooltipOnClickOutside, { once: true }); }, 0);
            event.stopPropagation();
        });
    });
}

function removeExistingTooltip() {
    const existingTooltip = document.querySelector('.score-tooltip');
    if (existingTooltip) existingTooltip.remove();
}
function closeTooltipOnClickOutside(event) {
    if (!event.target.closest('.score-tooltip')) removeExistingTooltip();
}

// =================================================================
// RENDER FONKSİYONLARI
// =================================================================
function renderStandings(data) {
    const standingsBody = document.getElementById('standings-body');
    if (!standingsBody) return;
    standingsBody.innerHTML = '';
    data.sort((a, b) => (parseInt(b.Puan) || 0) - (parseInt(a.Puan) || 0)).forEach((team, index) => {
        const row = document.createElement('tr');
        row.className = 'clickable-row';
        row.dataset.branchName = team.SubeAdi;
        row.innerHTML = `<td>${index + 1}</td><td class="branch-cell"><img src="${getLogoUrl(team.SubeAdi)}" class="branch-logo" alt="${team.SubeAdi}" onerror="this.style.display='none'"><span>${team.SubeAdi}</span></td><td>${team.Oynanan || 0}</td><td>${team.Galibiyet || 0}</td><td>${team.Beraberlik || 0}</td><td>${team.Maglubiyet || 0}</td><td>${team.Puan || 0}</td>`;
        standingsBody.appendChild(row);
    });
}

function renderAllFixtures(data, weekDates) {
    const fixturesByWeekList = document.getElementById('fixtures-by-week-list');
    if (!fixturesByWeekList) return;
    const weeks = data.reduce((acc, item) => {
        const week = `Hafta ${item.Hafta}`;
        if (!acc[week]) acc[week] = [];
        acc[week].push(item);
        return acc;
    }, {});
    const weekDatesMap = weekDates.reduce((map, item) => { map[item.Hafta] = item.TarihAraligi; return map; }, {});
    fixturesByWeekList.innerHTML = Object.keys(weeks).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1])).map(weekName => {
        const weekNumber = weekName.split(' ')[1];
        const dateRange = weekDatesMap[weekNumber] ? `(${weekDatesMap[weekNumber]})` : '';
        const matchesHtml = weeks[weekName].map(match => {
            const homeTeamName = match.EvSahibi || '';
            const awayTeamName = match.Deplasman || '';
            const scoreA = match.EvSahibiSkor || '-';
            const scoreB = match.DeplasmanSkor || '-';
            const bonusA = (match.EvSahibiBonus || '').trim() !== '' ? `<span class="bonus-icon" title="Bonus: ${match.EvSahibiBrans || ''}">⭐</span>` : '';
            const bonusB = (match.DeplasmanBonus || '').trim() !== '' ? `<span class="bonus-icon" title="Bonus: ${match.DeplasmanBrans || ''}">⭐</span>` : '';
            return `<div class="match-row" data-teams="${homeTeamName.toLowerCase()} ${awayTeamName.toLowerCase()}"><span class="team home"><img src="${getLogoUrl(homeTeamName)}" class="branch-logo" alt="${homeTeamName}" onerror="this.style.display='none'"><span>${homeTeamName} ${bonusA}</span></span><div class="score-info-fixture"><span class="score">${scoreA}</span><span class="vs-separator-fixture">:</span><span class="score">${scoreB}</span></div><span class="team away"><img src="${getLogoUrl(awayTeamName)}" class="branch-logo" alt="${awayTeamName}" onerror="this.style.display='none'"><span>${awayTeamName} ${bonusB}</span></span></div>`;
        }).join('');
        return `<div class="week-container"><h3 class="week-title">${weekName} <span class="week-date-range">${dateRange}</span></h3>${matchesHtml}</div>`;
    }).join('');
}

// =================================================================
// ŞUBE PROFİL KARTI MODAL FONKSİYONLARI
// =================================================================
async function showBranchProfileModal(branchName) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'profile-modal-overlay';
    modalOverlay.innerHTML = `<div class="profile-modal-card"><div class="profile-modal-header"><img src="${getLogoUrl(branchName)}" class="profile-modal-logo" alt="${branchName} Logo" onerror="this.style.display='none'"><h2 class="profile-modal-title">${branchName}</h2><span class="profile-modal-close">&times;</span></div><div class="profile-modal-body"><div class="loader"></div></div></div>`;
    document.body.appendChild(modalOverlay);

    const closeModal = () => modalOverlay.remove();
    modalOverlay.querySelector('.profile-modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    const modalBody = modalOverlay.querySelector('.profile-modal-body');
    try {
        const [puanDurumuData, fixturesData, weekDates] = await Promise.all([
            fetchGoogleSheetData('PuanDurumu!A1:G'),
            fetchGoogleSheetData('Fikstur!A1:I'),
            fetchGoogleSheetData('HaftaTarihleri!A1:B')
        ]);

        const validPuanData = puanDurumuData.filter(s => s && s.SubeAdi);
        const validFixtures = fixturesData.filter(f => f && f.Hafta);
        const validDates = weekDates.filter(d => d && d.Hafta);
        
        const weekDatesMap = validDates.reduce((map, item) => { map[item.Hafta] = item.TarihAraligi; return map; }, {});
        const branchData = validPuanData.find(s => s.SubeAdi === branchName);

        if (!branchData) {
            displayError(modalBody, "Şube verileri bulunamadı.");
            return;
        }

        let bonusPuan = 0;
        const bonuslar = [];
        validFixtures.forEach(match => {
            // Ev sahibi takım bonusunu kontrol et
            if (match.EvSahibi === branchName) {
                const puan = parseInt(match.EvSahibiBonus, 10);
                if (!isNaN(puan) && puan > 0) {
                    bonusPuan += puan;
                    if (match.EvSahibiBrans) {
                        bonuslar.push({
                            hafta: match.Hafta,
                            brans: match.EvSahibiBrans,
                            puan: puan
                        });
                    }
                }
            }
            // Deplasman takım bonusunu kontrol et
            if (match.Deplasman === branchName) {
                const puan = parseInt(match.DeplasmanBonus, 10);
                if (!isNaN(puan) && puan > 0) {
                    bonusPuan += puan;
                    if (match.DeplasmanBrans) {
                        bonuslar.push({
                            hafta: match.Hafta,
                            brans: match.DeplasmanBrans,
                            puan: puan
                        });
                    }
                }
            }
        });
        
        const galibiyet = parseInt(branchData.Galibiyet || 0);
        const beraberlik = parseInt(branchData.Beraberlik || 0);
        const maglubiyet = parseInt(branchData.Maglubiyet || 0);
        const oynananMac = galibiyet + beraberlik + maglubiyet;
        const branchFixtures = validFixtures.filter(f => (f.EvSahibi === branchName || f.Deplasman === branchName) && f.EvSahibiSkor && f.DeplasmanSkor);

        const topLayoutHtml = `
            <div class="profile-stats-container">
                <div class="chart-and-legend">
                    <h3 class="profile-section-title">PERFORMANS DAĞILIMI</h3>
                    <div class="chart-wrapper"><canvas id="matchResultChart"></canvas></div>
                    <ul class="performance-legend">
                        <li class="legend-item"><span class="legend-color-box" style="background-color: #28a745;"></span>Galibiyet</li>
                        <li class="legend-item"><span class="legend-color-box" style="background-color: #6c757d;"></span>Beraberlik</li>
                        <li class="legend-item"><span class="legend-color-box" style="background-color: #dc3545;"></span>Mağlubiyet</li>
                    </ul>
                </div>
                <div class="stats-grid-new original-layout">
                    <div class="stat-card-new"><div class="stat-card-new-value">${branchData.Puan || 0}</div><div class="stat-card-new-label">PUAN</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${oynananMac}</div><div class="stat-card-new-label">MAÇ</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${galibiyet}</div><div class="stat-card-new-label">GALİBİYET</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${maglubiyet}</div><div class="stat-card-new-label">MAĞLUBİYET</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${beraberlik}</div><div class="stat-card-new-label">BERABERLİK</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${bonusPuan}</div><div class="stat-card-new-label">BONUS</div></div>
                </div>
            </div>`;

        const fixturesHtml = branchFixtures.length > 0 ? `<h3 class="profile-section-title">OYNANAN MAÇLAR</h3><div class="matches-list">${branchFixtures.map(match => {
            const dateRange = weekDatesMap[match.Hafta] || '';
            return `<div class="match-row-wrapper"><p class="match-week-info">Hafta ${match.Hafta} (${dateRange})</p><div class="match-row"><span class="team home"><img src="${getLogoUrl(match.EvSahibi)}" class="branch-logo"><span>${match.EvSahibi}</span></span><div class="score-info-fixture"><span class="score">${match.EvSahibiSkor}</span>:<span class="score">${match.DeplasmanSkor}</span></div><span class="team away"><span>${match.Deplasman}</span><img src="${getLogoUrl(match.Deplasman)}" class="branch-logo"></span></div></div>`
        }).join('')}</div>` : '<p>Henüz oynanmış maç bulunmuyor.</p>';

        const bonusHtml = bonuslar.length > 0
            ? `<h3 class="profile-section-title">KAZANILAN BONUSLAR</h3><div class="bonus-list">${bonuslar.map(bonus =>
                `<div class="bonus-item">
                    <span class="bonus-branch">${bonus.brans}</span>
                    <span class="bonus-points">+${bonus.puan} Puan</span>
                    <span class="bonus-week">Hafta ${bonus.hafta}</span>
                 </div>`
              ).join('')}</div>`
            : '';

        modalBody.innerHTML = topLayoutHtml + fixturesHtml + bonusHtml;
        new Chart(document.getElementById('matchResultChart').getContext('2d'), { type: 'doughnut', data: { labels: ['Galibiyet', 'Beraberlik', 'Mağlubiyet'], datasets: [{ data: [galibiyet, beraberlik, maglubiyet], backgroundColor: ['#28a745', '#6c757d', '#dc3545'], borderColor: 'rgba(26, 34, 56, 0.8)', borderWidth: 3 }] }, options: { responsive: true, cutout: '70%', plugins: { legend: { display: false } } } });
    } catch (error) {
        console.error("Profil verileri çekilirken hata:", error);
        displayError(modalBody, "Şube profili yüklenemedi.");
    }
}

// =================================================================
// SAYFA BAŞLATMA FONKSİYONLARI
// =================================================================
function initIndexPage() {
    loadWeeklyNews();
    fetchGoogleSheetData('PuanDurumu!A1:G').then(data => {
        const validData = data.filter(d => d && d.SubeAdi);
        renderStandings(validData);
        const standingsBody = document.getElementById('standings-body');
        if (standingsBody) {
            standingsBody.addEventListener('click', (e) => {
                const row = e.target.closest('.clickable-row');
                if (row && row.dataset.branchName) { showBranchProfileModal(row.dataset.branchName); }
            });
        }
    }).catch((err) => { console.error("Ana sayfa yüklenirken hata:", err); displayError(document.getElementById('standings-container')); });
}

function initKlasmanPage() {
    fetchGoogleSheetData('SubeKlasmanlari!A1:B').then(data => {
        const validData = data.filter(d => d && d.SubeAdi);
        renderBranchGroups(validData);
    }).catch((err) => { console.error("Klasman sayfası yüklenirken hata:", err); displayError(document.getElementById('branch-groups-container')); });
}

function initFiksturPage() {
    Promise.all([fetchGoogleSheetData('Fikstur!A1:I'), fetchGoogleSheetData('HaftaTarihleri!A1:B')]).then(([fixturesData, weekDates]) => {
        const validFixtures = fixturesData.filter(d => d && d.Hafta);
        const validDates = weekDates.filter(d => d && d.Hafta);
        renderAllFixtures(validFixtures, validDates);
        const searchInput = document.getElementById('fixture-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('.match-row').forEach(match => {
                    const teams = match.dataset.teams || '';
                    match.style.display = teams.includes(searchTerm) ? 'grid' : 'none';
                });
            });
        }
    }).catch((err) => { console.error("Fikstür sayfası yüklenirken hata:", err); displayError(document.getElementById('fixtures-page-container')); });
}

// =================================================================
// SONSUZ İHTİMALSİZLİK MOTORU VE MODAL MANTIĞI
// =================================================================
const improbabilityButton = document.getElementById('improbability-button'); if (improbabilityButton) { improbabilityButton.addEventListener('click', async () => { const userName = prompt("Lütfen motorun analiz etmesi için bir İsim Soyisim girin:"); if (!userName || userName.trim() === "") { alert("İsim Soyisim girmek zorunudur."); return; } const responseArea = document.getElementById('improbability-response'); responseArea.innerHTML = '<div class="loader"></div><p>İhtimaller hesaplanıyor...</p>'; improbabilityButton.disabled = true; const promptText = `YAPAY ZEKA ROLÜ: Sen, Douglas Adams'ın "Otostopçunun Galaksi Rehberi" tarzında yazan, esprili ve absürt bir yapay zekasın. Görevin, verilen bir isim için, birbiriyle alakasız olayları ve sıradan nesneleri birleştirerek, o kişi hakkında inanılmaz derecede ihtimal dışı ama GERÇEKCİ, komik ve övgü dolu bir "gerçek" senaryo üretmektir. KURALLAR: 1. Dilin basit, komik ve herkesin anlayacağı türden olsun. 2. Her senaryo mutlaka üç temel unsuru birleştirmeli: a) Antalya'ya özgü bir şey b) Bir sigorta veya bankacılık ürünü c) Bu ikisinin birleşimiyle ortaya çıkan absürt bir sonuç. 3. Her seferinde tamamen farklı bir bağlantı kur. Maksimum eğlence ve saçmalık hedefin olsun. 4. Sonuç, kişiyi veya şubesini komik bir şekilde övmeli. 5. Sadece ürettiğin senaryoyu yaz. ÖRNEK SENARYO: "Yapılan son 'nem ölçer' analizlerine göre, [İSİM]'in müşterisine 'Yuvam Sigortası' poliçesini anlatırken sergilediği sıcak ve samimi tavır, odadaki nem oranını %3 düşürmüştür. Bu durum, Antalya'daki genel 'yapış yapış hissetme' katsayısını anlık olarak iyileştirdiği için kendisine belediye tarafından gizli bir 'İklim Düzenleme Kahramanı' madalyası takılmıştır." GÖREV: Aşağıdaki isim için bu kurallara uygun bir senaryo üret. İSİM: ${userName}`; try { const result = await fetchGeminiData(promptText); responseArea.innerHTML = `<p>"${result.trim()}"</p>`; } catch (error) { console.error("Gemini Hatası Detayı:", error); responseArea.innerHTML = `<p class="error-message">İhtimaller, bir fincan çayın aniden varoluştan silinmesiyle sonuçlandı.</p>`; } finally { improbabilityButton.disabled = false; } }); }
let isModalContentLoaded = false;
function initModal() { const modal = document.getElementById('improbability-modal'); const openBtn = document.getElementById('what-is-it-button'); const closeBtn = document.querySelector('.modal-close-button'); const modalBody = document.getElementById('modal-body-content'); if (!modal || !openBtn || !closeBtn || !modalBody) return; async function loadModalContent() { if (isModalContentLoaded) return; modalBody.innerHTML = '<div class="loader"></div>'; try { const response = await fetch('ihtimalsizlik-nedir.html'); if (!response.ok) throw new Error('İçerik dosyası bulunamadı.'); modalBody.innerHTML = await response.text(); isModalContentLoaded = true; } catch (error) { console.error("Modal içeriği yüklenirken hata:", error); modalBody.innerHTML = '<p class="error-message">Açıklama içeriği yüklenirken bir sorun oluştu.</p>'; } } openBtn.addEventListener('click', async (e) => { e.preventDefault(); modal.classList.add('modal-visible'); await loadModalContent(); }); closeBtn.addEventListener('click', () => { modal.classList.remove('modal-visible'); }); modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('modal-visible'); } }); }

// =================================================================
// UYGULAMA BAŞLANGIÇ NOKTASI
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    initModal();
    if (document.getElementById('standings-body')) initIndexPage();
    if (document.getElementById('branch-groups-list')) initKlasmanPage();
    if (document.getElementById('fixtures-by-week-list')) initFiksturPage();
});