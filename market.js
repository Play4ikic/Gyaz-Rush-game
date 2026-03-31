import { updateBalance, refreshBalanceDisplay } from './economy.js';

// Загружаем инвентарь (теперь внутри функций, чтобы данные всегда были свежими)
function getInventory() {
    return JSON.parse(localStorage.getItem('myPlayers')) || [];
}

window.renderMarket = function() {
    const container = document.getElementById('market-list');
    const playerInventory = getInventory();
    container.innerHTML = "";

    if (playerInventory.length === 0) {
        container.innerHTML = "<p class='empty-msg'>У тебя нет игроков для продажи. Открой паки в магазине!</p>";
        return;
    }

    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'market-card-item';
        
        // Логика папок и цен
        const folder = player.folder || 'Toty';
        let sellPrice = 5000; // По умолчанию Champions

        if (folder === 'Gold') {
            sellPrice = 500;
        } else if (folder === 'Toty') {
            sellPrice = 10000;
        }

        card.innerHTML = `
            <img src="${folder}/${player.file}" class="player-img">
            <div class="sell-info">
                <span class="price-text">${sellPrice.toLocaleString()} CY</span>
                <button class="sell-btn" onclick="sellPlayer(${index}, ${sellPrice})">ПРОДАТЬ</button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.sellPlayer = async function(index, price) {
    let playerInventory = getInventory();
    const player = playerInventory[index];
    
    if (!player) return;

    // 1. Начисляем деньги в Firebase и локально
    const success = await updateBalance(price);

    if (success) {
        // 2. Убираем из состава, если он там был (чтобы не играть "призраком")
        let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
        activeSquad = activeSquad.map(slot => (slot && slot.file === player.file) ? null : slot);
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));

        // 3. Удаляем из инвентаря
        playerInventory.splice(index, 1);
        localStorage.setItem('myPlayers', JSON.stringify(playerInventory));

        // 4. Обновляем интерфейс
        window.renderMarket();
        refreshBalanceDisplay();
        
        console.log(`Игрок ${player.name} продан за ${price} CY`);
    } else {
        alert("Ошибка при продаже. Попробуй позже.");
    }
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.renderMarket();
    refreshBalanceDisplay();
});