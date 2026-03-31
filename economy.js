import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, update, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com", 
    storageBucket: "play4ik-473ef.firebasestorage.app",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const BALANCE_KEY = 'fixone_balance';

export function getBalance() {
    const bal = localStorage.getItem(BALANCE_KEY);
    return (bal === null || bal === "undefined") ? 20000 : parseInt(bal);
}

export async function updateBalance(amount) {
    let newBalance = getBalance() + amount;
    if (newBalance < 0) return false;

    localStorage.setItem(BALANCE_KEY, newBalance);
    refreshBalanceDisplay();
    
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        try {
            await update(ref(db, 'users/' + user.uid), { balance: newBalance });
        } catch(e) { console.warn("Firebase offline"); }
    }
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display, #user-coins');
    elements.forEach(el => { el.innerText = bal.toLocaleString() + " CY"; });
}

setInterval(refreshBalanceDisplay, 1000);
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);