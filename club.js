import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

// ФУНКЦИЯ ОБЛАЧНОГО СОХРАНЕНИЯ
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
    syncCloud(); // Сохраняем в облако
};

window.handleSlotClick = function(index) {
    if (activeSquad[index]) {
        activeSquad[index] = null;
        localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
        renderSquad();
        syncCloud(); // Сохраняем в облако
    }
};

window.clearSquad = function() {
    activeSquad = [null, null, null, null, null];
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));
    renderSquad();
    syncCloud(); // Сохраняем в облако
};

// ... твои функции renderClub, renderSquad и прочие без изменений ...