const BALANCE_KEY = 'fixone_balance';

export function getBalance() {
    let bal = localStorage.getItem(BALANCE_KEY);
    if (bal === null) {
        localStorage.setItem(BALANCE_KEY, 20000);
        return 20000;
    }
    return parseInt(bal);
}

export function updateBalance(amount) {
    let current = getBalance();
    let newBalance = current + amount;
    if (newBalance < 0) return false;
    localStorage.setItem(BALANCE_KEY, newBalance);
    refreshBalanceDisplay();
    return true;
}

export function refreshBalanceDisplay() {
    const bal = getBalance();
    const elements = document.querySelectorAll('#shop-balance, .balance-board, .balance-display');
    elements.forEach(el => {
        el.innerText = bal.toLocaleString() + " CY";
    });
}

// Запуск отображения
document.addEventListener('DOMContentLoaded', refreshBalanceDisplay);
setInterval(refreshBalanceDisplay, 1000);