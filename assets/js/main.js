// assets/js/main.js - 7 EYLÜL KAMPANYA BAŞLANGICI VE PAZARTESİ/SALI MANTIĞI

import { fetchGoogleSheetData, fetchGeminiData } from './api.js';

function getVal(obj, possibleKeys, fallbackIndex = -1) {
    if (!obj) return '';
    const keys = Object.keys(obj);
    
    for (let pKey of possibleKeys) {
        const foundKey = keys.find(k => 
            k.trim().toLocaleLowerCase('tr-TR') === pKey.toLocaleLowerCase('tr-TR') || 
            k.trim().toLowerCase() === pKey.toLowerCase()
        );
        if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
            return obj[foundKey];
        }
    }
    
    if (fallbackIndex >= 0 && fallbackIndex < keys.length) {
        return obj[keys[fallbackIndex]];
    }
    
    return '';
}

function getLogoUrl(branchName) {
    if (!branchName) return '';
    const sanitizedName = (branchName || '').toLowerCase().replace(/ şubesi/g, '').replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/\s+/g, '-');
    return `./assets/images/logos/${sanitizedName}.svg`;
}

function displayError(container, message = "Veriler yüklenemedi. Bağlantı, paylaşım ayarları veya veri formatını kontrol edin.") {
    if (container) container.innerHTML = `<p class="error-message">${message}</p>`;
}

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

function getCurrentCampaignWeek() {
    // Kampanya 7 Eylül 2026 Türkiye saati ile (UTC+3) başlıyor
    const startDate = new Date('2026-09-07T00:00:00+03:00'); 
    const today = new Date();

    if (today < startDate) return 1;

    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Kampanyada kaçıncı haftada olduğumuzu hesaplıyoruz
    const currentCalendarWeek = Math.floor(diffDays / 7) + 1;
    
    // Bugünün hangi gün olduğunu buluyoruz (0: Pazar, 1: Pazartesi, 2: Salı ...)
    const dayOfWeek = today.getDay(); 
    
    // YENİ KURAL: Eğer gün Pazartesi (1) ise, geçen haftayı (kapanan haftayı) göster. 
    // Diğer tüm günlerde bulunduğumuz güncel haftayı göster.
    let weekToShow = (dayOfWeek === 1) ? currentCalendarWeek - 1 : currentCalendarWeek;
    
    if (weekToShow < 1) weekToShow = 1;
    if (weekToShow > 13) weekToShow = 13;
    return weekToShow;
}

function formatMatchups(matches, allBranchData) {
    return matches.map(match => {
        const homeNameMatch = getVal(match, ['Takim1', 'Takım 1'], 3);
        const awayNameMatch = getVal(match, ['Takim2', 'Takım 2'], 4);
        
        if (!homeNameMatch || !awayNameMatch) return '';
        
        // MAÇ SKORLARI DOĞRUDAN FİKSTÜR SAYFASINDAN GELİYOR
        const scoreA = getVal(match, ['Takim1Skor', 'Takım 1 Skor'], 5) || '0';
        const scoreB = getVal(match, ['Takim2Skor', 'Takım 2 Skor'], 6) || '0';
        
        // ŞUBE DETAYLARI PUAN SAYFASINDAN GELİYOR (Tooltip J-N sütunları için)
        const teamA = allBranchData.find(branch => getVal(branch, ['SubeAdi', 'Şube'], 0) === homeNameMatch) || {};
        const teamB = allBranchData.find(branch => getVal(branch, ['SubeAdi', 'Şube'], 0) === awayNameMatch) || {};
        
        const teamA_details = `data-saglik="${getVal(teamA, ['Saglik', 'Sağlık']) || 0}" data-hayat="${getVal(teamA, ['Hayat']) || 0}" data-elementer="${getVal(teamA, ['Elementer']) || 0}" data-besciro="${getVal(teamA, ['BESCiro', 'BES Ciro']) || 0}" data-besadet="${getVal(teamA, ['BESAdet', 'BES Adet']) || 0}"`;
        const teamB_details = `data-saglik="${getVal(teamB, ['Saglik', 'Sağlık']) || 0}" data-hayat="${getVal(teamB, ['Hayat']) || 0}" data-elementer="${getVal(teamB, ['Elementer']) || 0}" data-besciro="${getVal(teamB, ['BESCiro', 'BES Ciro']) || 0}" data-besadet="${getVal(teamB, ['BESAdet', 'BES Adet']) || 0}"`;
        
        return `<div class="matchup-item">
                    <div class="matchup-team team-a">
                        <img src="${getLogoUrl(homeNameMatch)}" class="matchup-team-logo" alt="${homeNameMatch}" onerror="this.style.display='none'">
                        <span class="matchup-team-name">${homeNameMatch}</span>
                        <div class="matchup-main-score clickable-score" ${teamA_details}>${scoreA}</div>
                    </div>
                    <div class="matchup-vs-graphic">VS</div>
                    <div class="matchup-team team-b">
                        <img src="${getLogoUrl(awayNameMatch)}" class="matchup-team-logo" alt="${awayNameMatch}" onerror="this.style.display='none'">
                        <span class="matchup-team-name">${awayNameMatch}</span>
                        <div class="matchup-main-score clickable-score" ${teamB_details}>${scoreB}</div>
                    </div>
                </div>`;
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

        const [fixturesData, allBranchData] = await Promise.all([ 
            fetchGoogleSheetData('Fikstür!A1:K'), 
            fetchGoogleSheetData('Puan!A1:O') 
        ]);
        const validFixtures = fixturesData.filter(f => getVal(f, ['Hafta'], 0));
        const validBranchData = allBranchData.filter(b => getVal(b, ['SubeAdi', 'Şube'], 0));
        const weekToDisplay = getCurrentCampaignWeek();
        
        const weeklyFixtures = validFixtures.filter(f => parseInt(getVal(f, ['Hafta'], 0)) === weekToDisplay);
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
            tooltip.innerHTML = `<h4>Puan Dökümü</h4><ul><li><span>Sağlık:</span> <strong>${details.saglik}</strong></li><li><span>Hayat:</span> <strong>${details.hayat}</strong></li><li><span>Elementer:</span> <strong>${details.elementer}</strong></li><li><span>BES Ciro:</span> <strong>${details.besciro}</strong></li><li><span>BES Adet:</span> <strong>${details.besadet}</strong></li></ul>`;
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

function renderStandings(data) {
    const standingsBody = document.getElementById('standings-body');
    if (!standingsBody) return;
    standingsBody.innerHTML = '';
    data.sort((a, b) => (parseInt(getVal(b, ['Puan'], 5)) || 0) - (parseInt(getVal(a, ['Puan'], 5)) || 0)).forEach((team, index) => {
        const row = document.createElement('tr');
        row.className = 'clickable-row';
        const subeAdi = getVal(team, ['SubeAdi', 'Şube'], 0);
        row.dataset.branchName = subeAdi;
        row.innerHTML = `<td>${index + 1}</td><td class="branch-cell"><img src="${getLogoUrl(subeAdi)}" class="branch-logo" alt="${subeAdi}" onerror="this.style.display='none'"><span>${subeAdi}</span></td><td>${getVal(team, ['Oynanan'], 1) || 0}</td><td>${getVal(team, ['Galibiyet'], 2) || 0}</td><td>${getVal(team, ['Beraberlik'], 3) || 0}</td><td>${getVal(team, ['Maglubiyet', 'Mağlubiyet'], 4) || 0}</td><td>${getVal(team, ['Puan'], 5) || 0}</td>`;
        standingsBody.appendChild(row);
    });
}

function renderAllFixtures(data) {
    const fixturesByWeekList = document.getElementById('fixtures-by-week-list');
    if (!fixturesByWeekList) return;
    const weeks = data.reduce((acc, item) => {
        const weekNum = getVal(item, ['Hafta'], 0);
        const week = `Hafta ${weekNum}`;
        if (!acc[week]) acc[week] = [];
        acc[week].push(item);
        return acc;
    }, {});
    
    fixturesByWeekList.innerHTML = Object.keys(weeks).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1])).map(weekName => {
        let weekDate = '';
        const matchesHtml = weeks[weekName].map(match => {
            const tarihBas = getVal(match, ['HaftaBaslangici', 'Karşılaşma Başlangıç Tarihi'], 1);
            const tarihBit = getVal(match, ['HaftaBitisi', 'Karşılaşma Bitiş Tarihi'], 2);
            let tarih = tarihBas;
            if (tarihBit && tarihBit !== tarihBas) tarih += ' - ' + tarihBit;

            if (!weekDate && tarih) weekDate = `(${tarih})`;
            
            const homeTeamName = getVal(match, ['Takim1', 'Takım 1'], 3) || '';
            const awayTeamName = getVal(match, ['Takim2', 'Takım 2'], 4) || '';
            
            const scoreA = getVal(match, ['Takim1Skor', 'Takım 1 Skor'], 5) || '-';
            const scoreB = getVal(match, ['Takim2Skor', 'Takım 2 Skor'], 6) || '-';
            
            const bonusAName = getVal(match, ['Takim1BonusIsmi', 'Takım 1 Bonus İsmi'], 9) || 'Bonus';
            const bonusBName = getVal(match, ['Takim2BonusIsmi', 'Takım 2 Bonus İsmi'], 10) || 'Bonus';
            
            const bonusA = String(getVal(match, ['Takim1Bonus', 'Takım 1 Bonus'], 7)).trim() !== '' ? `<span class="bonus-icon" title="${bonusAName}">⭐</span>` : '';
            const bonusB = String(getVal(match, ['Takim2Bonus', 'Takım 2 Bonus'], 8)).trim() !== '' ? `<span class="bonus-icon" title="${bonusBName}">⭐</span>` : '';
            
            return `<div class="match-row" data-teams="${homeTeamName.toLowerCase()} ${awayTeamName.toLowerCase()}"><span class="team home"><img src="${getLogoUrl(homeTeamName)}" class="branch-logo" alt="${homeTeamName}" onerror="this.style.display='none'"><span>${homeTeamName} ${bonusA}</span></span><div class="score-info-fixture"><span class="score">${scoreA}</span><span class="vs-separator-fixture">:</span><span class="score">${scoreB}</span></div><span class="team away"><img src="${getLogoUrl(awayTeamName)}" class="branch-logo" alt="${awayTeamName}" onerror="this.style.display='none'"><span>${awayTeamName} ${bonusB}</span></span></div>`;
        }).join('');
        return `<div class="week-container"><h3 class="week-title">${weekName} <span class="week-date-range">${weekDate}</span></h3>${matchesHtml}</div>`;
    }).join('');
}

function renderBranchGroups(data) {
    const branchGroupsList = document.getElementById('branch-groups-list');
    if (!branchGroupsList) return;
    const groups = data.reduce((acc, item) => {
        const klasman = getVal(item, ['Klasman'], 1);
        const sube = getVal(item, ['SubeAdi', 'Şube Adı'], 0);
        if (klasman && sube) {
            if (!acc[klasman]) acc[klasman] = [];
            acc[klasman].push(sube);
        }
        return acc;
    }, {});
    branchGroupsList.innerHTML = Object.keys(groups).sort().map(groupName => `<div class="group-container"><h3 class="group-title">${groupName}</h3><ul class="group-list">${groups[groupName].sort().map(branch => `<li><img src="${getLogoUrl(branch)}" class="branch-logo" alt="${branch}" onerror="this.style.display='none'">${branch}</li>`).join('')}</ul></div>`).join('');
}

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
        const [puanDurumuData, fixturesData] = await Promise.all([
            fetchGoogleSheetData('Puan!A1:G'),
            fetchGoogleSheetData('Fikstür!A1:K')
        ]);

        const validPuanData = puanDurumuData.filter(s => getVal(s, ['SubeAdi', 'Şube'], 0));
        const validFixtures = fixturesData.filter(f => getVal(f, ['Hafta'], 0));
        
        const branchData = validPuanData.find(s => getVal(s, ['SubeAdi', 'Şube'], 0) === branchName) || {};

        let bonusPuan = 0;
        const bonuslar = [];
        validFixtures.forEach(match => {
            if (getVal(match, ['Takim1', 'Takım 1'], 3) === branchName) {
                const puan = parseInt(getVal(match, ['Takim1Bonus', 'Takım 1 Bonus'], 7), 10);
                if (!isNaN(puan) && puan > 0) {
                    bonusPuan += puan;
                    const bonusIsmi = getVal(match, ['Takim1BonusIsmi'], 9) || "Ek Puan";
                    bonuslar.push({ hafta: getVal(match, ['Hafta'], 0), brans: bonusIsmi, puan: puan });
                }
            }
            if (getVal(match, ['Takim2', 'Takım 2'], 4) === branchName) {
                const puan = parseInt(getVal(match, ['Takim2Bonus', 'Takım 2 Bonus'], 8), 10);
                if (!isNaN(puan) && puan > 0) {
                    bonusPuan += puan;
                    const bonusIsmi = getVal(match, ['Takim2BonusIsmi'], 10) || "Ek Puan";
                    bonuslar.push({ hafta: getVal(match, ['Hafta'], 0), brans: bonusIsmi, puan: puan });
                }
            }
        });
        
        const galibiyet = parseInt(getVal(branchData, ['Galibiyet'], 2) || 0);
        const beraberlik = parseInt(getVal(branchData, ['Beraberlik'], 3) || 0);
        const maglubiyet = parseInt(getVal(branchData, ['Maglubiyet', 'Mağlubiyet'], 4) || 0);
        const oynananMac = parseInt(getVal(branchData, ['Oynanan'], 1) || (galibiyet + beraberlik + maglubiyet));
        
        const branchFixtures = validFixtures.filter(f => {
            const h = getVal(f, ['Takim1', 'Takım 1'], 3);
            const a = getVal(f, ['Takim2', 'Takım 2'], 4);
            return (h === branchName || a === branchName) && (getVal(f, ['Takim1Skor'], 5) || getVal(f, ['Takim2Skor'], 6));
        });

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
                    <div class="stat-card-new"><div class="stat-card-new-value">${getVal(branchData, ['Puan'], 5) || 0}</div><div class="stat-card-new-label">PUAN</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${oynananMac}</div><div class="stat-card-new-label">MAÇ</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${galibiyet}</div><div class="stat-card-new-label">GALİBİYET</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${maglubiyet}</div><div class="stat-card-new-label">MAĞLUBİYET</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${beraberlik}</div><div class="stat-card-new-label">BERABERLİK</div></div>
                    <div class="stat-card-new"><div class="stat-card-new-value">${bonusPuan}</div><div class="stat-card-new-label">BONUS</div></div>
                </div>
            </div>`;

        const fixturesHtml = branchFixtures.length > 0 ? `<h3 class="profile-section-title">OYNANAN MAÇLAR</h3><div class="matches-list">${branchFixtures.map(match => {
            const dateRange = getVal(match, ['HaftaBaslangici', 'Tarih'], 1) || '';
            const scoreA = getVal(match, ['Takim1Skor'], 5) || '-';
            const scoreB = getVal(match, ['Takim2Skor'], 6) || '-';
            const h = getVal(match, ['Takim1', 'Takım 1'], 3);
            const a = getVal(match, ['Takim2', 'Takım 2'], 4);
            return `<div class="match-row-wrapper"><p class="match-week-info">Hafta ${getVal(match, ['Hafta'], 0)} (${dateRange})</p><div class="match-row"><span class="team home"><img src="${getLogoUrl(h)}" class="branch-logo"><span>${h}</span></span><div class="score-info-fixture"><span class="score">${scoreA}</span><span class="vs-separator-fixture">:</span><span class="score">${scoreB}</span></div><span class="team away"><span>${a}</span><img src="${getLogoUrl(a)}" class="branch-logo"></span></div></div>`
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

function initIndexPage() {
    loadWeeklyNews();
    fetchGoogleSheetData('Puan!A1:G').then(data => {
        const validData = data.filter(d => getVal(d, ['SubeAdi', 'Şube'], 0));
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
    fetchGoogleSheetData('Klasman!A1:B').then(data => {
        const validData = data.filter(d => getVal(d, ['SubeAdi', 'Şube'], 0));
        renderBranchGroups(validData);
    }).catch((err) => { console.error("Klasman sayfası yüklenirken hata:", err); displayError(document.getElementById('branch-groups-container')); });
}

function initFiksturPage() {
    fetchGoogleSheetData('Fikstür!A1:K').then(fixturesData => {
        const validFixtures = fixturesData.filter(d => getVal(d, ['Hafta'], 0));
        renderAllFixtures(validFixtures);
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

const improbabilityButton = document.getElementById('improbability-button'); if (improbabilityButton) { improbabilityButton.addEventListener('click', async () => { const userName = prompt("Lütfen motorun analiz etmesi için bir İsim Soyisim girin:"); if (!userName || userName.trim() === "") { alert("İsim Soyisim girmek zorunudur."); return; } const responseArea = document.getElementById('improbability-response'); responseArea.innerHTML = '<div class="loader"></div><p>İhtimaller hesaplanıyor...</p>'; improbabilityButton.disabled = true; const promptText = `YAPAY ZEKA ROLÜ: Sen, Douglas Adams'ın "Otostopçunun Galaksi Rehberi" tarzında yazan, esprili ve absürt bir yapay zekasın. Görevin, verilen bir isim için, birbiriyle alakasız olayları ve sıradan nesneleri birleştirerek, o kişi hakkında inanılmaz derecede ihtimal dışı ama GERÇEKCİ, komik ve övgü dolu bir "gerçek" senaryo üretmektir. KURALLAR: 1. Dilin basit, komik ve herkesin anlayacağı türden olsun. 2. Her senaryo mutlaka üç temel unsuru birleştirmeli: a) Antalya'ya özgü bir şey b) Bir sigorta veya bankacılık ürünü c) Bu ikisinin birleşimiyle ortaya çıkan absürt bir sonuç. 3. Her seferinde tamamen farklı bir bağlantı kur. Maksimum eğlence ve saçmalık hedefin olsun. 4. Sonuç, kişiyi veya şubesini komik bir şekilde övmeli. 5. Sadece ürettiğin senaryoyu yaz. ÖRNEK SENARYO: "Yapılan son 'nem ölçer' analizlerine göre, [İSİM]'in müşterisine 'Yuvam Sigortası' poliçesini anlatırken sergilediği sıcak ve samimi tavır, odadaki nem oranını %3 düşürmüştür. Bu durum, Antalya'daki genel 'yapış yapış hissetme' katsayısını anlık olarak iyileştirdiği için kendisine belediye tarafından gizli bir 'İklim Düzenleme Kahramanı' madalyası takılmıştır." GÖREV: Aşağıdaki isim için bu kurallara uygun bir senaryo üret. İSİM: ${userName}`; try { const result = await fetchGeminiData(promptText); responseArea.innerHTML = `<p>"${result.trim()}"</p>`; } catch (error) { console.error("Gemini Hatası Detayı:", error); responseArea.innerHTML = `<p class="error-message">İhtimaller, bir fincan çayın aniden varoluştan silinmesiyle sonuçlandı.</p>`; } finally { improbabilityButton.disabled = false; } }); }
let isModalContentLoaded = false;
function initModal() { const modal = document.getElementById('improbability-modal'); const openBtn = document.getElementById('what-is-it-button'); const closeBtn = document.querySelector('.modal-close-button'); const modalBody = document.getElementById('modal-body-content'); if (!modal || !openBtn || !closeBtn || !modalBody) return; async function loadModalContent() { if (isModalContentLoaded) return; modalBody.innerHTML = '<div class="loader"></div>'; try { const response = await fetch('ihtimalsizlik-nedir.html'); if (!response.ok) throw new Error('İçerik dosyası bulunamadı.'); modalBody.innerHTML = await response.text(); isModalContentLoaded = true; } catch (error) { console.error("Modal içeriği yüklenirken hata:", error); modalBody.innerHTML = '<p class="error-message">Açıklama içeriği yüklenirken bir sorun oluştu.</p>'; } } openBtn.addEventListener('click', async (e) => { e.preventDefault(); modal.classList.add('modal-visible'); await loadModalContent(); }); closeBtn.addEventListener('click', () => { modal.classList.remove('modal-visible'); }); modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('modal-visible'); } }); }

document.addEventListener('DOMContentLoaded', () => {
    initModal();
    if (document.getElementById('standings-body')) initIndexPage();
    if (document.getElementById('branch-groups-list')) initKlasmanPage();
    if (document.getElementById('fixtures-by-week-list')) initFiksturPage();
});