// --- ИНИЦИАЛИЗАЦИЯ ДАННЫХ ---
let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
// Массив из 5 элементов (слоты 0-4), изначально пустые (null)
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

// 1. СКРЫТИЕ/ПОКАЗ ИНВЕНТАРЯ (КЛУБА)
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

// 2. ДОБАВЛЕНИЕ ИГРОКА В СОСТАВ (БЕЗ УЧЕТА ПОЗИЦИЙ)
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

    // ЛОГИКА ПОИСКА МЕСТА: Ищем первый попавшийся свободный слот (null)
    const targetSlot = activeSquad.findIndex(slot => slot === null);

    // Если свободных мест нет (findIndex вернул -1)
    if (targetSlot === -1) {
        alert("Состав заполнен! Удалите игрока с поля, чтобы освободить место.");
        return;
    }

    // Если место найдено, добавляем игрока
    activeSquad[targetSlot] = player;
    // Сохраняем обновленный состав в память браузера
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    // Перерисовываем поле
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
        
        // Определяем папку (если не указана в данных, берем по рейтингу)
        const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
        
        card.innerHTML = `
            <img src="${folder}/${player.file}" 
                 class="mini-card-img" 
                 onclick="addToSquad(${index})"
                 title="${player.name} (${player.pos || '---'})">
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
            // Если в слоте есть игрок, рисуем его карточку
            const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
            slot.innerHTML = `<img src="${folder}/${player.file}" class="field-card-img" onclick="handleSlotClick(${i})">`;
            slot.className = "player-slot has-player";
        } else {
            // Если слот пустой, рисуем заглушку с generic-названием
            // i+1 чтобы было "ИГРОК 1", "ИГРОК 2" и т.д.
            slot.innerHTML = `<div class="slot-label">ИГРОК ${i + 1}</div>`;
            slot.className = "player-slot";
        }
    });
    updateAvg(); // Обновляем средний рейтинг
}

// 5. УДАЛЕНИЕ ИГРОКА ПРИ КЛИКЕ НА СЛОТ НА ПОЛЕ
window.handleSlotClick = function(index) {
    if (activeSquad[index]) {
        // Освобождаем слот
        activeSquad[index] = null;
        // Сохраняем в память
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        // Перерисовываем
        renderSquad();
    }
};

// 6. РАСЧЕТ И ОТОБРАЖЕНИЕ СРЕДНЕГО РЕЙТИНГА
function updateAvg() {
    const onField = activeSquad.filter(p => p !== null); // Берем только тех, кто на поле
    const badge = document.getElementById('avg-rating');
    if (!badge) return;
    
    if (onField.length > 0) {
        const sum = onField.reduce((acc, p) => acc + (Number(p.rating) || 0), 0);
        badge.innerText = `AVG: ${Math.round(sum / onField.length)}`;
    } else {
        badge.innerText = `AVG: 0`;
    }
}

// 7. ОЧИСТКА ВСЕГО СОСТАВА
window.clearSquad = function() {
    if (confirm("Очистить весь состав?")) {
        activeSquad = [null, null, null, null, null];
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
    }
};

// ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
window.onload = () => { 
    renderClub(); 
    renderSquad(); 
};
