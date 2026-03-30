let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 

    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        
        // Авто-выбор папки по рейтингу
        let folder = "Gold";
        if (player.rating >= 90) folder = "Champions";
        if (player.rating >= 97) folder = "Toty";

        card.innerHTML = `
            <img src="${folder}/${player.file}" class="mini-card-img" onclick="addToSquad(${index})">
        `;
        container.appendChild(card);
    });
}

function renderSquad() {
    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;
        if (player) {
            let folder = player.rating >= 90 ? "Champions" : "Gold";
            if (player.rating >= 97) folder = "Toty";
            slot.innerHTML = `<img src="${folder}/${player.file}" class="field-card-img" onclick="handleSlotClick(${i})">`;
        } else {
            slot.innerHTML = `<div class="slot-label">${i === 0 ? 'GK' : 'FLD'}</div>`;
        }
    });
}

window.addToSquad = function(idx) {
    const p = playerInventory[idx];
    let slot = p.pos === "GK" ? 0 : activeSquad.findIndex((s, i) => i > 0 && s === null);
    if (slot !== -1) {
        activeSquad[slot] = p;
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
    }
};

window.handleSlotClick = (i) => {
    activeSquad[i] = null;
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
};

window.onload = () => { renderClub(); renderSquad(); };