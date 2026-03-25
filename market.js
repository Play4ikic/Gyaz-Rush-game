let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];

function renderMarket() {
    const container = document.getElementById('market-list');
    container.innerHTML = "";

    if (playerInventory.length === 0) {
        container.innerHTML = "<p class='empty-msg'>У тебя нет игроков для продажи.</p>";
        return;
    }

    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'market-card-item';
        
        const folder = player.folder || 'Toty';
        
        // НОВАЯ ЛОГИКА ЦЕН:
        let sellPrice;
        if (folder === 'Gold') {
            sellPrice = 500; // Цена для золотых
        } else if (folder === 'Toty') {
            sellPrice = 10000; // Цена для TOTY
        } else {
            sellPrice = 5000; // Цена для Champions
        }

        card.innerHTML = `
            <img src="${folder}/${player.file}" class="player-img">
            <div class="sell-info">
                <span class="price-text">${sellPrice} CY</span>
                <button class="sell-btn" onclick="sellPlayer(${index}, ${sellPrice})">ПРОДАТЬ</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function sellPlayer(index, price) {
    const player = playerInventory[index];
    
    // 1. Начисляем деньги
    if (typeof updateBalance === "function") {
        updateBalance(price);
    }

    // 2. Убираем из состава, если он там был
    let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
    activeSquad = activeSquad.map(slot => (slot && slot.file === player.file) ? null : slot);
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));

    // 3. Удаляем из инвентаря
    playerInventory.splice(index, 1);
    localStorage.setItem('myPlayers', JSON.stringify(playerInventory));

    // 4. Обновляем интерфейс мгновенно
    renderMarket();
    if (typeof refreshBalanceDisplay === "function") refreshBalanceDisplay();
}

window.onload = () => {
    renderMarket();
    if (typeof refreshBalanceDisplay === "function") refreshBalanceDisplay();
};