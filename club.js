import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com",
    storageBucket: "play4ik-473ef.firebasestorage.app",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function getUserId() {
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        try { return JSON.parse(userStr).uid; } catch(e) {}
    }
    return null;
}

function saveSquadState(squad) {
    const jsonStr = JSON.stringify(squad);
    localStorage.setItem('activeSquad', jsonStr);

    const uid = getUserId();
    if (uid) {
        update(ref(db, `users/${uid}`), { activeSquad: jsonStr });
    }
}

let playerInventory = JSON.parse(localStorage.getItem('myPlayers')) || [];
let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];

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

window.addToSquad = function(inventoryIndex) {
    const player = playerInventory[inventoryIndex];

    const isAlreadyOnField = activeSquad.some(p => p && p.file === player.file);
    if (isAlreadyOnField) {
        alert("Эта карточка уже в составе!");
        return;
    }

    const isNameDuplicate = activeSquad.some(p => p && p.name === player.name);
    if (isNameDuplicate) {
        alert(`Игрок ${player.name} уже есть в составе! Выберите другого игрока.`);
        return;
    }

    const targetSlot = activeSquad.findIndex(slot => slot === null);

    if (targetSlot === -1) {
        alert("Состав заполнен! Удалите игрока с поля, чтобы освободить место.");
        return;
    }

    activeSquad[targetSlot] = player;
    saveSquadState(activeSquad);
    renderSquad();
};

function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 

    playerInventory.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
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

function renderSquad() {
    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;

        if (player) {
            const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
            slot.innerHTML = `<img src="${folder}/${player.file}" class="field-card-img" onclick="handleSlotClick(${i})">`;
            slot.className = "player-slot has-player";
        } else {
            slot.innerHTML = `<div class="slot-label">ИГРОК ${i + 1}</div>`;
            slot.className = "player-slot";
        }
    });
    updateAvg();
}

window.handleSlotClick = function(index) {
    if (activeSquad[index]) {
        activeSquad[index] = null;
        saveSquadState(activeSquad);
        renderSquad();
    }
};

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

window.clearSquad = function() {
    if (confirm("Очистить весь состав?")) {
        activeSquad = [null, null, null, null, null];
        saveSquadState(activeSquad);
        renderSquad();
    }
};

window.onload = () => { 
    renderClub(); 
    renderSquad(); 
};