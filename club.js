let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

// 1. СКРЫТИЕ ИНВЕНТАРЯ
function toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const pitch = document.getElementById('pitch-area');
    const btn = document.querySelector('.toggle-inventory-btn');
    
    panel.classList.toggle('hidden');
    pitch.classList.toggle('expanded');
    
    if (panel.classList.contains('hidden')) {
        btn.innerText = "⬆ ПОКАЗАТЬ КЛУБ";
        btn.style.bottom = "20px";
    } else {
        btn.innerText = "⬇ СКРЫТЬ КЛУБ";
        btn.style.bottom = "26vh";
    }
}

// 2. СТРОГАЯ ПРОВЕРКА ПОЗИЦИЙ ПРИ ДОБАВЛЕНИИ
window.addToSquad = function(inventoryIndex) {
    const player = playerInventory[inventoryIndex];
    const isAlreadyOnField = activeSquad.some(p => p && p.file === player.file);
    
    if (isAlreadyOnField) return alert("Этот игрок уже в составе!");

    let targetSlot = -1;

    // ПРАВИЛО: GK только в слот 0, FLD только в 1-4
    if (player.pos === "GK") {
        if (!activeSquad[0]) targetSlot = 0;
        else return alert("Позиция вратаря уже занята!");
    } else {
        // Ищем свободное место среди полевых (индексы 1, 2, 3, 4)
        targetSlot = activeSquad.findIndex((p, idx) => idx > 0 && p === null);
        if (targetSlot === -1) return alert("Все места для полевых игроков заняты!");
    }

    activeSquad[targetSlot] = player;
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
};

// --- ОСТАЛЬНЫЕ ФУНКЦИИ (renderClub, renderSquad, clearSquad) ОСТАЮТСЯ ИЗ ПРЕДЫДУЩЕГО ОТВЕТА ---
function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 
    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
        card.innerHTML = `<img src="${folder}/${player.file}" class="mini-card-img" onclick="addToSquad(${index})">`;
        container.appendChild(card);
    });
}

function renderSquad() {
    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;
        if (player) {
            const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
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

window.handleSlotClick = function(index) {
    if (activeSquad[index]) {
        activeSquad[index] = null;
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
    }
};

function updateAvg() {
    const onField = activeSquad.filter(p => p !== null);
    const badge = document.getElementById('avg-rating');
    if (!badge) return;
    const sum = onField.reduce((acc, p) => acc + (Number(p.rating) || 0), 0);
    badge.innerText = `AVG: ${onField.length > 0 ? Math.round(sum / onField.length) : 0}`;
}

window.clearSquad = function() {
    activeSquad = [null, null, null, null, null];
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
};

window.onload = () => { renderClub(); renderSquad(); };