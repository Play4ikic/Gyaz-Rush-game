import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
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
const auth = getAuth(app);
const db = getDatabase(app);

// Получение UID пользователя
function getUserId() {
    if (auth.currentUser) return auth.currentUser.uid;
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        try {
            const parsed = JSON.parse(userStr);
            return parsed.uid || parsed.id || null;
        } catch(e) {}
    }
    return null;
}

// Безопасное чтение карточек клуба
function getMyClubPlayers() {
    try {
        let raw = localStorage.getItem('myPlayers');
        if (!raw) return [];

        while (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (parsed === raw) break;
                raw = parsed;
            } catch (e) {
                break;
            }
        }

        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            return Object.values(raw);
        }

        return Array.isArray(raw) ? raw : [];
    } catch (e) {
        console.error("Ошибка чтения клуба:", e);
        return [];
    }
}

// Безопасное чтение состава на поле (5 слотов: 0 - GK, 1..4 - FLD)
function getActiveSquad() {
    try {
        let raw = localStorage.getItem('activeSquad');
        if (!raw) return [null, null, null, null, null];

        while (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (parsed === raw) break;
                raw = parsed;
            } catch (e) {
                break;
            }
        }

        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            raw = Object.values(raw);
        }

        if (Array.isArray(raw)) {
            while (raw.length < 5) raw.push(null);
            return raw.slice(0, 5);
        }

        return [null, null, null, null, null];
    } catch (e) {
        return [null, null, null, null, null];
    }
}

// Путь к картинке
function getCardImgSrc(player) {
    if (!player || !player.file) return '';
    if (player.file.includes('/') || player.file.startsWith('http') || player.file.startsWith('data:')) {
        return player.file;
    }
    const folder = player.folder || (Number(player.rating) >= 97 ? 'Toty' : 'Champions');
    return `${folder}/${player.file}`;
}

// Сохранение в LocalStorage и Firebase
function saveSquadState(squad) {
    const jsonStr = JSON.stringify(squad);
    localStorage.setItem('activeSquad', jsonStr);

    const uid = getUserId();
    if (uid) {
        update(ref(db, `users/${uid}`), { activeSquad: jsonStr });
    }
}

// Слушатель Firebase в реальном времени
function startFirebaseListener(uid) {
    if (!uid) return;

    const userRef = ref(db, `users/${uid}`);
    onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            if (data.myPlayers !== undefined) {
                const playersStr = typeof data.myPlayers === 'string' 
                    ? data.myPlayers 
                    : JSON.stringify(data.myPlayers);
                localStorage.setItem('myPlayers', playersStr);
            }

            if (data.activeSquad !== undefined) {
                const squadStr = typeof data.activeSquad === 'string' 
                    ? data.activeSquad 
                    : JSON.stringify(data.activeSquad);
                localStorage.setItem('activeSquad', squadStr);
            }

            renderClub();
            renderSquad();
        }
    });
}

// --- ФУНКЦИИ ДЛЯ HTML (ЭКСПОРТИРУЕМ В WINDOW) ---

// 1. Скрыть / Показать панель клуба
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

// 2. Добавить игрока из клуба в состав
window.addToSquad = function(inventoryIndex) {
    const playerInventory = getMyClubPlayers();
    const activeSquad = getActiveSquad();
    const player = playerInventory[inventoryIndex];

    if (!player) return;

    // Проверка дубликата карточки
    const isAlreadyOnField = activeSquad.some(p => p && (
        (p.file && p.file === player.file) || 
        (p.id && p.id === player.id)
    ));

    if (isAlreadyOnField) {
        alert("Эта карточка уже в составе!");
        return;
    }

    // Проверка дубликата по имени
    const isNameDuplicate = activeSquad.some(p => p && p.name === player.name);
    if (isNameDuplicate) {
        alert(`Игрок ${player.name} уже есть в составе! Выберите другого игрока.`);
        return;
    }

    // Поиск свободного слота
    const targetSlot = activeSquad.findIndex(slot => slot === null);

    if (targetSlot === -1) {
        alert("Состав заполнен! Удалите игрока с поля, чтобы освободить место.");
        return;
    }

    activeSquad[targetSlot] = player;
    saveSquadState(activeSquad);
    renderSquad();
};

// 3. Клик по слоту на поле (удаление игрока)
window.handleSlotClick = function(index) {
    const activeSquad = getActiveSquad();
    if (activeSquad[index]) {
        activeSquad[index] = null;
        saveSquadState(activeSquad);
        renderSquad();
    }
};

// 4. Очистить весь состав
window.clearSquad = function() {
    if (confirm("Очистить весь состав?")) {
        const emptySquad = [null, null, null, null, null];
        saveSquadState(emptySquad);
        renderSquad();
    }
};

// Отрисовка клуба (панель снизу)
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
        if (!player) return;
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        const imgSrc = getCardImgSrc(player);
        
        card.innerHTML = `
            <img src="${imgSrc}" 
                 class="mini-card-img" 
                 onclick="addToSquad(${index})"
                 title="${player.name || 'Игрок'} (${player.pos || '---'})">
        `;
        container.appendChild(card);
    });
}

// Отрисовка поля (slot-0 = GK, slot-1..4 = FLD)
function renderSquad() {
    const activeSquad = getActiveSquad();

    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;

        if (player && typeof player === 'object') {
            const imgSrc = getCardImgSrc(player);
            slot.innerHTML = `<img src="${imgSrc}" class="field-card-img">`;
            slot.className = "player-slot has-player";
        } else {
            const labelText = (i === 0) ? 'GK' : 'FLD';
            slot.innerHTML = `<div class="slot-label">${labelText}</div>`;
            slot.className = "player-slot";
        }
    });
    updateAvg();
}

// Расчет среднего рейтинга
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

// Старт при загрузке
document.addEventListener('DOMContentLoaded', () => {
    renderClub(); 
    renderSquad(); 

    onAuthStateChanged(auth, (user) => {
        if (user) {
            startFirebaseListener(user.uid);
        } else {
            const localUid = getUserId();
            if (localUid) startFirebaseListener(localUid);
        }
    });
});