import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

// КЛЮЧИ ИЗ ТВОЕГО LOCALSTORAGE
const BALANCE_KEY = 'fixone_balance'; 
const BIZ_VAL_KEY = 'gyaz_biz_val';
const BIZ_TIME_KEY = 'gyaz_biz_time';

// НАСТРОЙКИ БИЗНЕСА
const BIZ_MAX = 6000;
const BIZ_INCOME = 20;

// --- 1. ФУНКЦИИ БАЛАНСА ---

export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    // Если ключа нет, ставим 20000
    if (bal === null || bal === "undefined") {
        localStorage.setItem(BALANCE_KEY, 20000);
        return 20000;
    }
    return parseInt(bal);
}

export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false;

    // Сохраняем локально для мгновенного отклика
    localStorage.setItem(BALANCE_KEY, newBalance);
    refreshBalanceDisplay();
    
    // Синхронизируем с Firebase
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { 
            console.warn("Firebase Sync Offline"); 
        }
    }
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    // Обновляем все элементы на странице (ID из твоих скриптов)
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins, #balance-text, #user-balance');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// --- 2. ЛОГИКА БИЗНЕСА (FIXONE) ---

function updateBusiness() {
    let currentBiz = parseInt(localStorage.getItem(BIZ_VAL_KEY)) || 0;
    let lastTime = parseInt(localStorage.getItem(BIZ_TIME_KEY)) || Date.now();
    
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastTime) / 1000);

    if (diffSeconds >= 1) {
        if (currentBiz < BIZ_MAX) {
            currentBiz += diffSeconds * BIZ_INCOME;
            if (currentBiz > BIZ_MAX) currentBiz = BIZ_MAX;
        }
        localStorage.setItem(BIZ_VAL_KEY, currentBiz);
        localStorage.setItem(BIZ_TIME_KEY, now);
    }

    // Вывод прибыли бизнеса на экран
    const display = document.getElementById('business-display');
    if (display) {
        display.innerText = Math.floor(currentBiz).toLocaleString() + " / " + BIZ_MAX + " CY";
        display.style.color = (currentBiz >= BIZ_MAX) ? "#ff4444" : "#00ff88";
    }
}

// ГЛОБАЛЬНАЯ КНОПКА СБОРА (window делает её доступной в HTML)
window.collectBusinessMoney = async function() {
    let currentBiz = parseInt(localStorage.getItem(BIZ_VAL_KEY)) || 0;
    
    if (currentBiz >= 1) {
        const added = await updateBalance(Math.floor(currentBiz));
        if (added) {
            localStorage.setItem(BIZ_VAL_KEY, 0);
            localStorage.setItem(BIZ_TIME_KEY, Date.now());
            console.log("Прибыль собрана!");
        }
    } else {
        alert("Бизнес еще не накопил денег!");
    }
};

// --- 3. ИНИЦИАЛИЗАЦИЯ ---

// При загрузке тянем актуальный баланс из Firebase
async function syncOnStart() {
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        try {
            const snapshot = await get(ref(db, 'users/' + user.uid + '/balance'));
            if (snapshot.exists()) {
                localStorage.setItem(BALANCE_KEY, snapshot.val());
                refreshBalanceDisplay();
            }
        } catch(e) { console.log("Start sync failed"); }
    }
}

// Запуск циклов
syncOnStart();
setInterval(updateBusiness, 1000);
setInterval(refreshBalanceDisplay, 1000);

// Обработка кнопки продажи (если она есть на странице)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('sell-btn')) {
        const price = parseInt(e.target.dataset.price) || 0;
        if (price > 0) updateBalance(price);
    }
});