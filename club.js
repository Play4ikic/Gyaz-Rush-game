import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

async function syncCloud() {
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (!user) return;
    const db = getDatabase();
    await update(ref(db, 'users/' + user.uid), {
        inventory: playerInventory,
        squad: activeSquad
    });
}

// ГЛАВНАЯ ФУНКЦИЯ: ОТОБРАЖЕНИЕ КАРТОЧЕК
function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 

    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        
        // Логика папок: 97+ это Toty, 90+ это Champions
        let folder = "Gold";
        if (player.rating >= 97) folder = "Toty";
        else if (player.rating >= 90) folder = "Champions";

        // Если картинка не грузится, выводим ошибку в консоль
        card.innerHTML = `
            <img src="${folder}/${player.file}" 
                 class="mini-card-img" 
                 onclick="addToSquad(${index})"
                 onerror="console.error('Ошибка пути: ${folder}/${player.file}')">
        `;
        container.appendChild(card);
    });
}

function renderSquad() {
    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;
        if (player) {
            let folder = player.rating >= 97 ? "Toty" : (player.rating >= 90 ? "Champions" : "Gold");
            slot.innerHTML = `<img src="${folder}/${player.file}" class="field-card-img" onclick="handleSlotClick(${i})">`;
        } else {
            slot.innerHTML = `<div class="slot-label">${i === 0 ? 'GK' : 'FLD'}</div>`;
        }
    });
}

window.addToSquad = function(idx) {
    const p = playerInventory[idx];
    if (activeSquad.some(s => s && s.file === p.file)) return;
    let slot = p.pos === "GK" ? 0 : activeSquad.findIndex((s, i) => i > 0 && s === null);
    if (slot === -1) return;
    activeSquad[slot] = p;
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
    syncCloud();
};

window.handleSlotClick = (i) => {
    activeSquad[i] = null;
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
    syncCloud();
};

window.onload = () => { renderClub(); renderSquad(); };