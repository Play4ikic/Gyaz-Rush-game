import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// Загружаем данные
let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

// --- 1. СИНХРОНИЗАЦИЯ С ОБЛАКОМ ---
async function syncCloud() {
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (!user) return;

    const db = getDatabase();
    await update(ref(db, 'users/' + user.uid), {
        inventory: playerInventory,
        squad: activeSquad
    });
    console.log("Клуб синхронизирован с Firebase!");
}

// --- 2. ОТОБРАЖЕНИЕ ИНВЕНТАРЯ (ИСПРАВЛЕНО ВИЗУАЛЬНО) ---
function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 
    
    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        
        // Определяем папку, чтобы картинка была видна
        let folder = player.folder || "Gold";
        if (player.rating >= 97) folder = "Toty";
        else if (player.rating >= 90) folder = "Champions";

        card.innerHTML = `<img src="${folder}/${player.file}" class="mini-card-img" onclick="addToSquad(${index})">`;
        container.appendChild(card);
    });
}

// --- 3. ОТОБРАЖЕНИЕ СОСТАВА НА ПОЛЕ ---
function renderSquad() {
    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;
        
        if (player) {
            let folder = player.folder || "Gold";
            if (player.rating >= 97) folder = "Toty";
            else if (player.rating >= 90) folder = "Champions";

            slot.innerHTML = `<img src="${folder}/${player.file}" class="field-card-img" onclick="handleSlotClick(${i})">`;
            slot.className = "player-slot has-player";
        } else {
            const positions = ['GK', 'FLD', 'FLD', 'FLD', 'FLD'];
            slot.innerHTML = `<div class="slot-label">${positions[i]}</div>`;
            slot.className = "player-slot";
        }
    });
    updateAvg();
}

// --- 4. ЛОГИКА ДОБАВЛЕНИЯ И УДАЛЕНИЯ ---
window.addToSquad = function(inventoryIndex) {
    const player = playerInventory[inventoryIndex];
    const isAlreadyOnField = activeSquad.some(p => p && p.file === player.file);
    
    if (isAlreadyOnField) return alert("Этот игрок уже в составе!");

    let targetSlot = -1;
    if (player.pos === "GK") {
        if (!activeSquad[0]) targetSlot = 0;
        else return alert("Позиция вратаря уже занята!");
    } else {
        targetSlot = activeSquad.findIndex((p, idx) => idx > 0 && p === null);
        if (targetSlot === -1) return alert("Все места для полевых игроков заняты!");
    }

    activeSquad[targetSlot] = player;
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    
    renderSquad();
    syncCloud(); 
};

window.handleSlotClick = function(index) {
    if (activeSquad[index]) {
        activeSquad[index] = null;
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
        syncCloud(); 
    }
};

window.clearSquad = function() {
    if(!confirm("Очистить весь состав?")) return;
    activeSquad = [null, null, null, null, null];
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
    syncCloud(); 
};

function updateAvg() {
    const onField = activeSquad.filter(p => p !== null);
    const badge = document.getElementById('avg-rating');
    if (!badge) return;
    const sum = onField.reduce((acc, p) => acc + (Number(p.rating) || 0), 0);
    badge.innerText = `AVG: ${onField.length > 0 ? Math.round(sum / onField.length) : 0}`;
}

// Скрыть/Показать инвентарь
window.toggleInventory = function() {
    const panel = document.getElementById('inventory-panel');
    panel.classList.toggle('hidden');
};

window.onload = () => { 
    renderClub(); 
    renderSquad(); 
};