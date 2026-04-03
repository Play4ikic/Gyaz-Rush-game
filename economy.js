// 1. Инициализация баланса (если новый игрок)
if (!localStorage.getItem('fixone_balance')) {
    localStorage.setItem('fixone_balance', '10000'); // Даем 10к на старт
}

// 2. ФУНКЦИЯ ОБНОВЛЕНИЯ БАЛАНСА (С ПРОВЕРКОЙ)
// Теперь она async, чтобы в будущем легко подключить Firebase
export async function updateBalance(amount) {
    let currentBalance = parseInt(localStorage.getItem('fixone_balance')) || 0;
    
    // ПРОВЕРКА: Если мы покупаем (amount отрицательный)
    if (amount < 0) {
        if (currentBalance + amount < 0) {
            console.error("Недостаточно средств!");
            return false; // Денег нет — возвращаем ложь
        }
    }

    // Сохраняем новый баланс
    const newBalance = currentBalance + amount;
    localStorage.setItem('fixone_balance', newBalance.toString());
    
    // Сразу обновляем все цифры на экране
    refreshBalanceDisplay();
    
    console.log(`Баланс обновлен: ${newBalance} CY`);
    return true; // Операция успешна
}

// 3. ФУНКЦИЯ ОТОБРАЖЕНИЯ (Ищет все блоки баланса на любой странице)
export function refreshBalanceDisplay() {
    const balance = localStorage.getItem('fixone_balance') || "0";
    
    const displays = [
        document.getElementById('balance-display'),
        document.getElementById('shop-balance'),
        document.getElementById('user-balance'),
        document.getElementById('user-money-display') // ДОБАВЬ ЭТОТ ID
    ];

    displays.forEach(el => {
        if (el) {
            el.innerText = parseInt(balance).toLocaleString() + " CY";
        }
    });
}

// Авто-обновление при загрузке любого модуля
refreshBalanceDisplay();