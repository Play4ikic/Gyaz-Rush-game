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

const BALANCE_KEY = 'fixone_balance';

// 1. ПОЛУЧЕНИЕ: Сначала смотрим в телефон, если там пусто — берем 20к
export function getBalance() {
    const localBal = localStorage.getItem(BALANCE_KEY);
    if (localBal === null || localBal === "undefined") {
        return 20000; 
    }
    return parseInt(localBal);
}

// 2. ОБНОВЛЕНИЕ: Сначала меняем на телефоне, потом шлем в облако
export async function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    
    if (newBalance < 0) return false;

    // Мгновенное сохранение на устройстве
    localStorage.setItem(BALANCE_KEY, newBalance);
    refreshBalanceDisplay();
    
    // Попытка отправить в Firebase (если не выйдет — не страшно)
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { 
            console.log("Firebase временно недоступен, данные сохранены локально."); 
        }
    }
    return true;
}

// 3. СИНХРОНИЗАЦИЯ: Только если в облаке БОЛЬШЕ денег, чем на телефоне
async function safeSync() {
    const userStr = localStorage.getItem('gyaz_user');
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const snapshot = await get(ref(db, 'users/' + user.uid + '/balance'));
        
        if (snapshot.exists()) {
            const cloudBal = parseInt(snapshot.val());
            const localBal = getBalance();
            
            // Если на сервере денег больше (например, зашел с другого ПК), обновляем
            if (cloudBal > localBal) {
                localStorage.setItem(BALANCE_KEY, cloudBal);
                refreshBalanceDisplay();
            }
        }
    } catch(e) { console.error("Ошибка проверки сервера"); }
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// Запуск
safeSync();
setInterval(refreshBalanceDisplay, 1000);
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);