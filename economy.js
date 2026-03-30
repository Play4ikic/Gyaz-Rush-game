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

// КЛЮЧИ (как на твоем скриншоте)
const BALANCE_KEY = 'fixone_balance'; 
const BIZ_VAL_KEY = 'gyaz_biz_val';
const BIZ_TIME_KEY = 'gyaz_biz_time';

// 1. ПОЛУЧЕНИЕ БАЛАНСА
export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    if (bal === null || bal === "undefined") {
        localStorage.setItem(BALANCE_KEY, 20000); // Стартовый капитал
        return 20000;
    }
    return parseInt(bal);
}

// 2. ОБНОВЛЕНИЕ БАЛАНСА (ВЕЗДЕ: Firebase + Local)
export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false;

    localStorage.setItem(BALANCE_KEY, newBalance);
    
    // Синхронизация с Firebase
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { console.error("Firebase update failed"); }
    }
    
    refreshBalanceDisplay();
    return true;
}

// 3. ОБНОВЛЕНИЕ ТЕКСТА НА ЭКРАНЕ
export function refreshBalanceDisplay() {
    const bal = getBalance();
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins, #balance-text');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// 4. СИНХРОНИЗАЦИЯ ПРИ ЗАГРУЗКЕ
async function initialSync() {
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        const snapshot = await get(ref(db, 'users/' + user.uid + '/balance'));
        if (snapshot.exists()) {
            localStorage.setItem(BALANCE_KEY, snapshot.val());
            refreshBalanceDisplay();
        }
    }
}

initialSync();
setInterval(refreshBalanceDisplay, 1000);
