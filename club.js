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

// Стандартные координаты слотов (в процентах от ширины и высоты поля)
const DEFAULT_POSITIONS = [
    { left: 50, top: 82 }, // slot-0 (GK)
    { left: 18, top: 25 }, // slot-1 (FLD)
    { left: 39, top: 25 }, // slot-2 (FLD)
    { left: 61, top: 25 }, // slot-3 (FLD)
    { left: 82, top: 25 }  // slot-4 (FLD)
];

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

function getMyClubPlayers() {
    try {
        let raw = localStorage.getItem('myPlayers');
        if (!raw) return [];
        while (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (parsed === raw) break;
                raw = parsed;
            } catch (e) { break; }
        }
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) return Object.values(raw);
        return Array.isArray(raw) ? raw : [];
    } catch (e) {
        return [];
    }
}

function getActiveSquad() {
    try {
        let raw = localStorage.getItem('activeSquad');
        if (!raw) return [null, null, null, null, null];
        while (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (parsed === raw) break;
                raw = parsed;
            } catch (e) { break; }
        }
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) raw = Object.values(raw);
        if (Array.isArray(raw)) {
            while (raw.length < 5) raw.push(null);
            return raw.slice(0, 5);
        }
        return [null, null, null, null, null];
    } catch (e) {
        return [null, null, null, null, null];
    }
}

function getSlotPositions() {
    try {
        const saved = localStorage.getItem('slotPositions');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 5 && parsed[0] && typeof parsed[0].left === 'number') {
                return parsed;
            }
        }
    } catch(e) {}
    saveSlotPositions(DEFAULT_POSITIONS);
    return DEFAULT_POSITIONS;
}

function saveSlotPositions(positions) {
    localStorage.setItem('slotPositions', JSON.stringify(positions));
}

function getCardImgSrc(player) {
    if (!player || !player.file) return '';
    if (player.file.includes('/') || player.file.startsWith('http') || player.file.startsWith('data:')) {
        return player.file;
    }
    const folder = player.folder || (Number(player.rating) >= 97 ? 'Toty' : 'Champions');
    return `${folder}/${player.file}`;
}

function saveSquadState(squad) {
    const jsonStr = JSON.stringify(squad);
    localStorage.setItem('activeSquad', jsonStr);

    const uid = getUserId();
    if (uid) {
        update(ref(db, `users/${uid}`), { activeSquad: jsonStr });
    }
}

function applyPositions() {
    const positions = getSlotPositions();
    positions.forEach((pos, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) {
            slot.style.left = `${pos.left}%`;
            slot.style.top = `${pos.top}%`;
        }
    });
}

// --- DRAG & DROP ДЛЯ ПОЛЕВЫХ СЛОТОВ (1..4) ---
function initDragAndDrop() {
    const pitch = document.getElementById('football-pitch');
    if (!pitch) return;

    let isDragging = false;
    let draggedSlot = null;
    let clickTimer = null;
    let hasMoved = false;

    for (let i = 1; i <= 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) continue;

        slot.addEventListener('pointerdown', (e) => {
            isDragging = true;
            draggedSlot = slot;
            hasMoved = false;

            slot.setPointerCapture(e.pointerId);

            clickTimer = setTimeout(() => {
                hasMoved = true;
            }, 120);
        });

        slot.addEventListener('pointermove', (e) => {
            if (!isDragging || draggedSlot !== slot) return;

            hasMoved = true;
            const pitchRect = pitch.getBoundingClientRect();

            let x = e.clientX - pitchRect.left;
            let y = e.clientY - pitchRect.top;

            let leftPercent = Math.max(8, Math.min(92, (x / pitchRect.width) * 100));
            let topPercent = Math.max(10, Math.min(90, (y / pitchRect.height) * 100));

            slot.style.left = `${leftPercent}%`;
            slot.style.top = `${topPercent}%`;
        });

        const handlePointerUp = (e) => {
            if (!isDragging || draggedSlot !== slot) return;

            clearTimeout(clickTimer);
            isDragging = false;
            draggedSlot = null;

            const positions = getSlotPositions();
            positions[i] = {
                left: parseFloat(slot.style.left),
                top: parseFloat(slot.style.top)
            };
            saveSlotPositions(positions);

            if (!hasMoved) {
                handleSlotClick(i);
            }
        };

        slot.addEventListener('pointerup', handlePointerUp);
        slot.addEventListener('pointercancel', handlePointerUp);
    }
}

// --- ЭКСПОРТ В WINDOW ---

window.resetSlotPositions = function() {
    saveSlotPositions(DEFAULT_POSITIONS);
    applyPositions();
};

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
        btn.style.bottom = "25.5vh";
    }
};

window.addToSquad = function(inventoryIndex) {
    const playerInventory = getMyClubPlayers();
    const activeSquad = getActiveSquad();
    const player = playerInventory[inventoryIndex];

    if (!player) return;

    if (activeSquad.some(p => p && ((p.file && p.file === player.file) || (p.id && p.id === player.id)))) {
        alert("Эта карточка уже в составе!");
        return;
    }

    if (activeSquad.some(p => p && p.name === player.name)) {
        alert(`Игрок ${player.name} уже есть в составе!`);
        return;
    }

    const targetSlot = activeSquad.findIndex(slot => slot === null);
    if (targetSlot === -1) {
        alert("Состав заполнен!");
        return;
    }

    activeSquad[targetSlot] = player;
    saveSquadState(activeSquad);
    renderSquad();
};

window.handleSlotClick = function(index) {
    const activeSquad = getActiveSquad();
    if (activeSquad[index]) {
        activeSquad[index] = null;
        saveSquadState(activeSquad);
        renderSquad();
    }
};

window.clearSquad = function() {
    if (confirm("Очистить весь состав?")) {
        saveSquadState([null, null, null, null, null]);
        renderSquad();
    }
};

function renderClub() {
    const container = document.getElementById('club-inventory');
    if (!container) return;
    container.innerHTML = ""; 

    const playerInventory = getMyClubPlayers();
    if (playerInventory.length === 0) {
        container.innerHTML = "<p style='color: #888; text-align: center; width: 100%; font-size: 12px;'>В вашем клубе пока нет карточек.</p>";
        return;
    }

    playerInventory.forEach((player, index) => {
        if (!player) return;
        const card = document.createElement('div');
        card.className = 'inventory-card-mini';
        card.innerHTML = `
            <img src="${getCardImgSrc(player)}" 
                 class="mini-card-img" 
                 onclick="addToSquad(${index})"
                 title="${player.name || 'Игрок'}">
        `;
        container.appendChild(card);
    });
}

function renderSquad() {
    const activeSquad = getActiveSquad();

    activeSquad.forEach((player, i) => {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) return;

        if (player && typeof player === 'object') {
            slot.innerHTML = `<img src="${getCardImgSrc(player)}" class="field-card-img">`;
            slot.classList.add("has-player");
        } else {
            const labelText = (i === 0) ? 'GK' : 'FLD';
            slot.innerHTML = `<div class="slot-label">${labelText}</div>`;
            slot.classList.remove("has-player");
        }
    });
    updateAvg();
}

function updateAvg() {
    const activeSquad = getActiveSquad();
    const onField = activeSquad.filter(p => p !== null);
    const badge = document.getElementById('avg-rating');
    if (!badge) return;
    
    if (onField.length > 0) {
        const sum = onField.reduce((acc, p) => acc + (Number(p.rating) || 0), 0);
        badge.innerText = `${Math.round(sum / onField.length)}`;
    } else {
        badge.innerText = `0`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyPositions();
    initDragAndDrop();
    renderClub(); 
    renderSquad(); 

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = ref(db, `users/${user.uid}`);
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (data.myPlayers !== undefined) {
                        localStorage.setItem('myPlayers', typeof data.myPlayers === 'string' ? data.myPlayers : JSON.stringify(data.myPlayers));
                    }
                    if (data.activeSquad !== undefined) {
                        localStorage.setItem('activeSquad', typeof data.activeSquad === 'string' ? data.activeSquad : JSON.stringify(data.activeSquad));
                    }
                    renderClub();
                    renderSquad();
                }
            });
        }
    });
});