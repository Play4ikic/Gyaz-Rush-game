import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update, get, onValue } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

const BALANCE_KEY = 'fixone_balance'; // ЕДИНЫЙ КЛЮЧ ДЛЯ ВСЕГО
const BIZ_VAL_KEY = 'gyaz_biz_val';
const BIZ_TIME_KEY = 'gyaz_biz_time';
const BIZ_MAX = 6000;
const BIZ_INCOME = 20;

// --- 1. СИНХРОНИЗАЦИЯ ПРИ ЗАХОДЕ ---
async function syncWithFirebase() {
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user && user.uid) {
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.balance !== undefined) {
                // Если в базе денег больше или они отличаются - обновляем локально
                localStorage.setItem(BALANCE_KEY, data.balance);
                refreshBalanceDisplay();
                console.log("Баланс синхронизирован из Firebase:", data.balance);
            }
        }
    }
}

// --- 2. ЛОГИКА БАЛАНСА ---
export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    // Если в локале пусто, пробуем вернуть 20000, но syncWithFirebase это исправит
    return bal !== null ? parseInt(bal) : 20000;
}

export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false;

    // Сначала сохраняем локально, чтобы игрок сразу видел изменения
    localStorage.setItem(BALANCE_KEY, newBalance);
    refreshBalanceDisplay();
    
    // Затем отправляем в облако
    const user = JSON.parse(localStorage.getItem('gyaz_user'));
    if (user && user.uid) {
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { console.warn("Firebase Sync Fail"); }
    }
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    // Добавляем все возможные ID и классы, которые ты используешь
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins, #balance-text');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// --- 3. ЛОГИКА БИЗНЕСА ---
let currentBizMoney = parseInt(localStorage.getItem(BIZ_VAL_KEY)) || 0;
let lastUpdate = parseInt(localStorage.getItem(BIZ_TIME_KEY)) || Date.now();

function updateBizLogic() {
    const now = Date.now();
    const elapsed = Math.floor((now - lastUpdate) / 1000);

    if (elapsed >= 1) {
        if (currentBizMoney < BIZ_MAX) {
            currentBizMoney += elapsed * BIZ_INCOME;
            if (currentBizMoney > BIZ_MAX) currentBizMoney = BIZ_MAX;
        }
        lastUpdate = now;
        localStorage.setItem(BIZ_VAL_KEY, currentBizMoney);
        localStorage.setItem(BIZ_TIME_KEY, lastUpdate);
    }

    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentBizMoney).toLocaleString() + " / " + BIZ_MAX + " CY";
        display.style.color = (currentBizMoney >= BIZ_MAX) ? "#ff4444" : "#00ff88";
    }
}

// Глобальная кнопка сбора
window.collectBusinessMoney = async function() {
    if (currentBizMoney >= 1) {
        const toAdd = Math.floor(currentBizMoney);
        const ok = await updateBalance(toAdd);
        if (ok) {
            currentBizMoney = 0;
            lastUpdate = Date.now();
            localStorage.setItem(BIZ_VAL_KEY, 0);
            localStorage.setItem(BIZ_TIME_KEY, lastUpdate);
            updateBizLogic();
        }
    }
};

// --- СТАРТ ---
syncWithFirebase(); // Запускаем синхронизацию сразу при загрузке скрипта
setInterval(updateBizLogic, 1000);
setInterval(refreshBalanceDisplay, 1000);

document.addEventListener('DOMContentLoaded', () => {
    refreshBalanceDisplay();
    updateBizLogic();
});
