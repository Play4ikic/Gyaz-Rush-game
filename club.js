// --- ИНИЦИАЛИЗАЦИЯ ДАННЫХ ---
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

// 2. СТРОГАЯ ПРОВЕРКА ПОЗИЦИЙ И ДУБЛИКАТОВ ИМЕН
window.addToSquad = function(inventoryIndex) {
    const player = playerInventory[inventoryIndex];

    // ПРОВЕРКА 1: Нельзя добавить ту же самую карточку (по имени файла)
    const isAlreadyOnField = activeSquad.some(p => p && p.file === player.file);
    if (isAlreadyOnField) {
        alert("Эта карточка уже в составе!");
        return;
    }

    // ПРОВЕРКА 2: Нельзя добавить игрока с таким же ИМЕНЕМ (например, два Месси)
    const isNameDuplicate = activeSquad.some(p => p && p.name === player.name);
    if (isNameDuplicate) {
        alert(`Игрок ${player.name} уже есть в составе! Выберите другого игрока.`);
        return;
    }

    let targetSlot = -1;

    // ПРАВИЛО ПОЗИЦИЙ: GK только в слот 0, остальные в 1-4
    if (player.pos === "GK") {
        if (!activeSquad[0]) {
            targetSlot = 0;
        } else {
            alert("Позиция вратаря уже занята!");
            return;
        }
    } else {
        // Ищем свободное место среди полевых (индексы 1, 2, 3, 4)
        targetSlot = activeSquad.findIndex((p, idx) => idx > 0 && p === null);
        if (targetSlot === -1) {
            alert("Все места для полевых игроков заняты!");
            return;
        }
    }

    // Если все проверки пройдены
    activeSquad[targetSlot] = player;
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
};

// 3. ОТРИСОВКА КЛУБА (ИНВЕНТАРЯ)
function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 

    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        
        // Определяем папку (если не указана, берем по рейтингу)
        const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
        
        card.innerHTML = `
            <img src="${folder}/${player.file}" 
                 class="mini-card-img" 
                 onclick="addToSquad(${index})"
                 title="${player.name} (${player.pos})">
        `;
        container.appendChild(card);
    });
}

// 4. ОТРИСОВКА ПОЛЯ (СОСТАВА)
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

// 5. УДАЛЕНИЕ ИГРОКА ПРИ КЛИКЕ НА СЛОТ
window.handleSlotClick = function(index) {
    if (activeSquad[index]) {
        activeSquad[index] = null;
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
    }
};

// 6. СРЕДНИЙ РЕЙТИНГ
function updateAvg() {
    const onField = activeSquad.filter(p => p !== null);
    const badge = document.getElementById('avg-rating');
    if (!badge) return;
    
    if (onField.length > 0) {
        const sum = onField.reduce((acc, p) => acc + (Number(p.rating) || 0), 0);
        badge.innerText = `AVG: ${Math.round(sum / onField.length)}`;
    } else {
        badge.innerText = `AVG: 0`;
    }
}

// 7. ОЧИСТКА СОСТАВА
window.clearSquad = function() {
    if (confirm("Очистить весь состав?")) {
        activeSquad = [null, null, null, null, null];
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
    }
};

// ЗАПУСК ПРИ ЗАГРУЗКЕ
window.onload = () => { 
    renderClub(); 
    renderSquad(); 
};