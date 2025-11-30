// assets/js/hesaplama.js - TÜM İSTEKLERİ İÇEREN SON GÜNCEL HALİ

document.addEventListener('DOMContentLoaded', () => {
    const calculatorBody = document.getElementById('calculator-body');
    const calculateButton = document.getElementById('calculate-button');
    const resetButton = document.getElementById('reset-button');
    const sinerjiBonusuCheckbox = document.getElementById('sinerji-bonusu');
    const totalScoreDisplay = document.getElementById('total-score-display');

    const branches = [
        { id: 'saglik', name: 'Sağlık', basePoint: 20 },
        { id: 'elementer', name: 'Elementer', basePoint: 20 },
        { id: 'hayat', name: 'Hayat', basePoint: 30 },
        { id: 'bes-hacim', name: 'BES Hacim', basePoint: 20 },
        { id: 'bes-adet', name: 'BES Adet', basePoint: 10 }
    ];

    // Sayıları binlik ayraçla formatlayan fonksiyon
    function formatNumber(value) {
        if (!value) return '';
        const numberString = value.toString().replace(/\./g, '');
        return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Formatlanmış sayıdan normal sayıya dönen fonksiyon
    function parseNumber(value) {
        return parseFloat(value.replace(/\./g, '')) || 0;
    }
    
    // Tabloyu Dinamik Olarak Oluştur
    function renderTable() {
        let html = '';
        branches.forEach(branch => {
            html += `
                <tr data-id="${branch.id}">
                    <td data-label="Sigorta Branşı">${branch.name} <span class="branch-percentage">(${branch.basePoint}%)</span></td>
                    <td data-label="Haftalık Hedef"><input type="text" class="calc-input" id="${branch.id}-hedef" placeholder="0" inputmode="numeric"></td>
                    <td data-label="Gerçekleşen"><input type="text" class="calc-input" id="${branch.id}-gerceklesen" placeholder="0" inputmode="numeric"></td>
                    <td data-label="Kazanılan Puan" style="text-align: center; font-weight: bold; font-size: 1.2rem;" id="${branch.id}-puan">0.00</td>
                </tr>
            `;
        });
        calculatorBody.innerHTML = html;

        // Input'lara anlık formatlama event listener'ı ekle
        document.querySelectorAll('.calc-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const selectionStart = e.target.selectionStart;
                const originalLength = e.target.value.length;
                e.target.value = formatNumber(e.target.value);
                const newLength = e.target.value.length;
                e.target.setSelectionRange(selectionStart + (newLength - originalLength), selectionStart + (newLength - originalLength));
            });
        });
    }

    // Puan Hesaplama Fonksiyonu
    function calculateScore() {
        let totalScore = 0;

        branches.forEach(branch => {
            const hedefInput = document.getElementById(`${branch.id}-hedef`);
            const gerceklesenInput = document.getElementById(`${branch.id}-gerceklesen`);
            const puanDisplay = document.getElementById(`${branch.id}-puan`);

            const hedef = parseNumber(hedefInput.value);
            const gerceklesen = parseNumber(gerceklesenInput.value);
            
            let branchScore = 0;
            
            let basePoint = branch.basePoint;
            if (branch.id === 'bes-adet' && sinerjiBonusuCheckbox.checked) {
                basePoint = 20;
            }

            if (hedef > 0) {
                let ratio = gerceklesen / hedef;

                if (ratio >= 0.60) {
                    if (ratio > 2.0) {
                        ratio = 2.0;
                    }
                    branchScore = basePoint * ratio;
                }
            }

            puanDisplay.textContent = branchScore.toFixed(2);
            totalScore += branchScore;
        });

        totalScoreDisplay.textContent = totalScore.toFixed(2);
        totalScoreDisplay.classList.add('pulse');
        setTimeout(() => totalScoreDisplay.classList.remove('pulse'), 500);
    }

    // Formu Sıfırlama Fonksiyonu
    function resetCalculator() {
        document.querySelectorAll('.calc-input').forEach(input => input.value = '');
        branches.forEach(branch => {
            document.getElementById(`${branch.id}-puan`).textContent = '0.00';
        });
        sinerjiBonusuCheckbox.checked = false;
        totalScoreDisplay.textContent = '0';
    }

    calculateButton.addEventListener('click', calculateScore);
    resetButton.addEventListener('click', resetCalculator);

    renderTable();
});