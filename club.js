import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

// Функция для безопасного получения списка карточек из localStorage
function getMyClubPlayers() {
    try {
        const raw = localStorage.getItem('myPlayers');
        if (!raw) return [];
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : []);
    } catch (e) {
        console.error("Ошибка парсинга myPlayers:", e);
        return [];
    }
}

// Функция для безопасного получения состава из localStorage
function getActiveSquad() {
    try {
        const raw = localStorage.getItem('activeSquad');
        if (!raw) return [null, null, null, null, null];
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const arr = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? JSON.parse(parsed) : [null, null, null, null, null]);
        return arr.length === 5 ? arr : [null, null, null, null, null];
    } catch (e) {
        return [null, null, null, null, null];
    }
}

function saveSquadState(squad) {
    const jsonStr = JSON.stringify(squad);
    localStorage.setItem('activeSquad', jsonStr);

    const uid = getUserId();
    if (uid) {
        update(ref(db, `users/${uid}`), { activeSquad: jsonStr });
    }
}

// Живое прослушивание данных из Firebase
function listenToFirebaseData() {
    const uid = getUserId();
    if (!uid) return;

    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            if (data.myPlayers) {
                const playersStr = typeof data.myPlayers === 'string' ? data.myPlayers : JSON.stringify(data.myPlayers);
                localStorage.setItem('myPlayers', playersStr);
            }
            if (data.activeSquad) {
                const squadStr = typeof data.activeSquad === 'string' ? data.activeSquad : JSON.stringify(data.activeSquad);
                localStorage.setItem('activeSquad', squadStr);
            }

            // Перерисовываем интерфейс при получении свежих данных
            renderClub();
            renderSquad();
        }
    });
}

window.toggleInventory = function() {
    const panel = document.getElementById('inventory-panel');
    const pitch = document.getElementById('pitch-area');
    const btn = document.querySelector('.toggle-inventory-btn');
    
    if (!panel || !pitch || !btn) return;

    panel.classList.toggle('hidden');
    pitch.classList.toggle('expanded');
    
    if (panel.classList.contains('hidden')) {
        btn.innerText = "⬆ ПОКАЗАТЬ КЛУБ";
        btn.style.bottom = "20px";
    } else {
        btn.innerText = "⬇ СКРЫТЬ КЛУБ";
        btn.style.bottom = "26vh";
    }
};

window.addToSquad = function(inventoryIndex) {
    const playerInventory = getMyClubPlayers();
    const activeSquad = getActiveSquad();
    const player = playerInventory[inventoryIndex];

    if (!player) return;

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

    const playerInventory = getMyClubPlayers();

    if (playerInventory.length === 0) {
        container.innerHTML = "<p style='color: #888; text-align: center; width: 100%; padding: 20px;'>В вашем клубе пока нет карточек.</p>";
        return;
    }

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
    const activeSquad = getActiveSquad();

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
    const activeSquad = getActiveSquad();
    if (activeSquad[index]) {
        activeSquad[index] = null;
        saveSquadState(activeSquad);
        renderSquad();
    }
};

function updateAvg() {
    const activeSquad = getActiveSquad();
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
        const emptySquad = [null, null, null, null, null];
        saveSquadState(emptySquad);
        renderSquad();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderClub(); 
    renderSquad(); 
    listenToFirebaseData(); // Подключаем автоматическую загрузку карточек из Firebase
});