const SECRET_KEY = "FixOne_Goalyaz_SecureKey_2026_#99!";

// 0. Генерация контрольной цифровой подписи (хеша)
function generateSignature(amount) {
    const str = `${amount}:${SECRET_KEY}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Преобразование в 32-битное целое
    }
    return btoa(`sig_${hash}_${amount}`);
}

// Сохранение баланса вместе с защитной подписью
function setSecureBalance(amount) {
    const safeAmount = Math.max(0, parseInt(amount) || 0);
    localStorage.setItem('fixone_balance', safeAmount.toString());
    localStorage.setItem('fixone_sig', generateSignature(safeAmount));
}

// Безопасное чтение баланса с проверкой целостности
function getValidBalance() {
    const rawBalance = localStorage.getItem('fixone_balance');
    const rawSig = localStorage.getItem('fixone_sig');

    // Если игрок зашел первый раз
    if (rawBalance === null) {
        setSecureBalance(10000); // 10k на старт
        return 10000;
    }

    const currentBalance = parseInt(rawBalance) || 0;
    const expectedSig = generateSignature(currentBalance);

    // ПРОВЕРКА ВЗЛОМА: Если значения в localStorage были изменены вручную
    if (rawSig !== expectedSig) {
        console.warn("ВНИМАНИЕ: Обнаружена попытка изменить баланс через F12!");
        alert("Обнаружено несанкционированное изменение баланса! Значение сброшено.");
        setSecureBalance(0); // Сброс баланса при взломе
        return 0;
    }

    return currentBalance;
}

// 1. Инициализация баланса при старте
getValidBalance();

// 2. ФУНКЦИЯ ОБНОВЛЕНИЯ БАЛАНСА (С ЗАЩИТОЙ)
export async function updateBalance(amount) {
    let currentBalance = getValidBalance();
    
    // ПРОВЕРКА: Если списываем средства (amount отрицательный)
    if (amount < 0) {
        if (currentBalance + amount < 0) {
            console.error("Недостаточно средств!");
            return false;
        }
    }

    // Записываем обновленный баланс с новой подписью
    const newBalance = currentBalance + amount;
    setSecureBalance(newBalance);
    
    // Обновляем отображение на экране
    refreshBalanceDisplay();
    
    console.log(`Баланс обновлен: ${newBalance} CY`);
    return true;
}

// 3. ФУНКЦИЯ ОТОБРАЖЕНИЯ БАЛАНСА
export function refreshBalanceDisplay() {
    const balance = getValidBalance();
    
    const displays = [
        document.getElementById('balance-display'),
        document.getElementById('shop-balance'),
        document.getElementById('user-balance')
    ];

    displays.forEach(el => {
        if (el) {
            el.innerText = balance.toLocaleString() + " CY";
        }
    });
}

// Авто-обновление при загрузке любого модуля
refreshBalanceDisplay();
