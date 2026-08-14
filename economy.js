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

const SECRET_KEY = "FixOne_Goalyaz_SecureKey_2026_#99!";
const SIG_VERSION = "v2";

function getUserId() {
    const userStr = localStorage.getItem('gyaz_user');
    if (userStr) {
        try { return JSON.parse(userStr).uid; } catch(e) {}
    }
    return null;
}

function generateSignature(amount) {
    const str = `${amount}:${SECRET_KEY}:${SIG_VERSION}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return btoa(`sig_${SIG_VERSION}_${hash}_${amount}`);
}

function setSecureBalance(amount) {
    const safeAmount = Math.max(0, parseInt(amount) || 0);
    const sig = generateSignature(safeAmount);

    localStorage.setItem('fixone_balance', safeAmount.toString());
    localStorage.setItem('fixone_sig', sig);

    // Синхронизация с Firebase
    const uid = getUserId();
    if (uid) {
        update(ref(db, `users/${uid}`), {
            balance: safeAmount,
            fixone_sig: sig
        });
    }
}

function getValidBalance() {
    let rawBalance = localStorage.getItem('fixone_balance');
    let rawSig = localStorage.getItem('fixone_sig');

    if (rawBalance === null && rawSig === null) {
        setSecureBalance(10000);
        return 10000;
    }

    if (rawBalance === null) rawBalance = '0';

    const currentBalance = parseInt(rawBalance) || 0;
    const expectedSig = generateSignature(currentBalance);

    if (!rawSig || rawSig.trim() === "" || !rawSig.startsWith(`sig_${SIG_VERSION}_`)) {
        setSecureBalance(currentBalance);
        return currentBalance;
    }

    if (rawSig !== expectedSig) {
        alert("Обнаружено несанкционированное изменение баланса! Значение сброшено.");
        setSecureBalance(0);
        return 0;
    }

    return currentBalance;
}

getValidBalance();

export async function updateBalance(amount) {
    let currentBalance = getValidBalance();
    
    if (amount < 0 && (currentBalance + amount < 0)) {
        console.error("Недостаточно средств!");
        return false;
    }

    const newBalance = currentBalance + amount;
    setSecureBalance(newBalance);
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const balance = getValidBalance();
    const displays = [
        document.getElementById('balance-display'),
        document.getElementById('shop-balance'),
        document.getElementById('user-balance')
    ];

    displays.forEach(el => {
        if (el) el.innerText = balance.toLocaleString() + " CY";
    });
}

refreshBalanceDisplay();