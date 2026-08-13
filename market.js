import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { updateBalance, refreshBalanceDisplay } from './economy.js';

// Конфигурация Firebase
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

// Данные пользователя
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "player_" + Math.floor(Math.random() * 10000), 
    nickname: "Игрок #" + Math.floor(Math.random() * 100) 
};
localStorage.setItem('gyaz_user', JSON.stringify(userData));

let selectedCardIndex = null;
let isProcessing = false; // Защита от частых кликов

// Получить клуб
function getMyClub() {
    return JSON.parse(localStorage.getItem('myPlayers')) || [];
}

// Сохранить клуб
function saveMyClub(club) {
    localStorage.setItem('myPlayers', JSON.stringify(club));
}

// ПЕРЕКЛЮЧЕНИЕ ТАБОВ
window.switchMarketTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.market-tab-content').forEach(content => content.classList.remove('active'));

    if (tabName === 'buy') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('tab-buy').classList.add('active');
    } else if (tabName === 'sell') {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('tab-sell').classList.add('active');
        renderSellClub();
    } else if (tabName === 'my-listings') {
        document.querySelectorAll('.tab-btn')[2].classList.add('active');
        document.getElementById('tab-my-listings').classList.add('active');
    }
};

// 1. АВТО-ВЫПЛАТА ЗА ПРОДАННЫЕ КАРТОЧКИ (ОФФЛАЙН/ОНЛАЙН)
function checkPendingPayouts() {
    const payoutRef = ref(db, `pending_payouts/${userData.uid}`);
    onValue(payoutRef, async (snapshot) => {
        if (snapshot.exists()) {
            const payouts = snapshot.val();
            let totalEarned = 0;

            Object.keys(payouts).forEach(key => {
                totalEarned += Number(payouts[key].amount) || 0;
            });

            if (totalEarned > 0) {
                await updateBalance(totalEarned);
                remove(payoutRef); // Очищаем выплату после зачисления
                alert(`🎉 Поздравляем! Ваши карточки были проданы на рынке. Зачислено: +${totalEarned.toLocaleString()} CY!`);
                refreshBalanceDisplay();
            }
        }
    }, { onlyOnce: true });
}

// 2. ОТОБРАЖЕНИЕ ОБЩЕГО РЫНОЧНОГО СПИСКА (КУПИТЬ)
function listenGlobalMarket() {
    const marketRef = ref(db, 'market_listings');
    const container = document.getElementById('market-buy-list');
    const myListingsContainer = document.getElementById('my-listings-list');

    onValue(marketRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = "";
        if (myListingsContainer) myListingsContainer.innerHTML = "";

        if (snapshot.exists()) {
            const listings = snapshot.val();
            let buyCount = 0;
            let myCount = 0;

            Object.keys(listings).forEach(id => {
                const item = listings[id];
                const isMine = item.sellerUid === userData.uid;

                const folder = item.card.folder || (item.card.rating >= 97 ? 'Toty' : 'Champions');
                const imagePath = item.card.image || `${folder}/${item.card.file}`;

                const cardEl = document.createElement('div');
                cardEl.className = 'market-card-item';

                if (!isMine) {
                    buyCount++;
                    cardEl.innerHTML = `
                        <img src="${imagePath}" class="player-img">
                        <div class="seller-name">Продавец: <b>${item.sellerName}</b></div>
                        <div class="price-text">${Number(item.price).toLocaleString()} CY</div>
                        <button class="buy-btn" onclick="buyCard('${id}', '${item.sellerUid}', ${item.price}, ${JSON.stringify(item.card).replace(/"/g, '&quot;')})">КУПИТЬ</button>
                    `;
                    container.appendChild(cardEl);
                } else {
                    myCount++;
                    cardEl.innerHTML = `
                        <img src="${imagePath}" class="player-img">
                        <div class="seller-name">Вы продаете</div>
                        <div class="price-text">${Number(item.price).toLocaleString()} CY</div>
                        <button class="cancel-btn" onclick="cancelListing('${id}', ${JSON.stringify(item.card).replace(/"/g, '&quot;')})">СНЯТЬ С ПРОДАЖИ</button>
                    `;
                    if (myListingsContainer) myListingsContainer.appendChild(cardEl);
                }
            });

            if (buyCount === 0) container.innerHTML = "<p class='empty-msg'>На рынке пока нет чужих карточек.</p>";
            if (myCount === 0 && myListingsContainer) myListingsContainer.innerHTML = "<p class='empty-msg'>У вас нет активных объявлений на рынке.</p>";
        } else {
            container.innerHTML = "<p class='empty-msg'>На рынке пока нет карточек.</p>";
            if (myListingsContainer) myListingsContainer.innerHTML = "<p class='empty-msg'>У вас нет активных объявлений на рынке.</p>";
        }
    });
}

// 3. ПОКУПКА КАРТОЧКИ
window.buyCard = async function(listingId, sellerUid, price, cardData) {
    if (isProcessing) return;
    isProcessing = true;

    // Безопасное чтение баланса из localStorage
    const currentBalance = parseInt(localStorage.getItem('fixone_balance')) || 0;

    if (currentBalance < price) {
        alert("⚠️ Недостаточно средств на балансе!");
        isProcessing = false;
        return;
    }

    if (confirm(`Вы уверены, что хотите купить ${cardData.name || 'игрока'} за ${price.toLocaleString()} CY?`)) {
        // 1. Списываем деньги
        const success = await updateBalance(-price);

        if (success) {
            // 2. Добавляем карточку покупателю
            let club = getMyClub();
            club.push(cardData);
            saveMyClub(club);

            // 3. Начисляем деньги продавцу через Firebase
            const payoutRef = push(ref(db, `pending_payouts/${sellerUid}`));
            set(payoutRef, {
                amount: price,
                cardName: cardData.name || 'Игрок',
                timestamp: Date.now()
            });

            // 4. Удаляем карточку с рынка
            remove(ref(db, `market_listings/${listingId}`));

            alert("🎉 Успешная покупка! Игрок добавлен в ваш клуб.");
            refreshBalanceDisplay();
        } else {
            alert("Ошибка проведения платежа.");
        }
    }
    isProcessing = false;
};

// 4. ОТОБРАЖЕНИЕ СВОЕГО КЛУБА ДЛЯ ПРОДАЖИ
function renderSellClub() {
    const container = document.getElementById('club-sell-list');
    const club = getMyClub();
    container.innerHTML = "";

    if (club.length === 0) {
        container.innerHTML = "<p class='empty-msg'>У вас нет карточек в клубе.</p>";
        return;
    }

    club.forEach((player, index) => {
        const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
        const imagePath = player.image || `${folder}/${player.file}`;

        const cardEl = document.createElement('div');
        cardEl.className = 'market-card-item';
        cardEl.innerHTML = `
            <img src="${imagePath}" class="player-img">
            <div style="font-weight:bold; font-size:13px; margin-bottom:10px;">${player.name || 'Игрок'}</div>
            <button class="list-btn" onclick="openPriceModal(${index})">ПРОДАТЬ</button>
        `;
        container.appendChild(cardEl);
    });
}

// 5. МОДАЛКА УСТАНОВКИ ЦЕНЫ
window.openPriceModal = function(index) {
    selectedCardIndex = index;
    const club = getMyClub();
    const player = club[index];

    document.getElementById('modal-card-name').innerText = player.name || 'Выбранный игрок';
    document.getElementById('card-price-input').value = "";
    document.getElementById('price-modal').style.display = 'flex';
};

window.closePriceModal = function() {
    document.getElementById('price-modal').style.display = 'none';
    selectedCardIndex = null;
};

document.getElementById('confirm-list-btn').onclick = function() {
    if (selectedCardIndex === null) return;

    const priceInput = document.getElementById('card-price-input');
    const price = parseInt(priceInput.value);

    if (!price || price <= 0) {
        alert("Пожалуйста, укажите корректную цену!");
        return;
    }

    let club = getMyClub();
    const player = club[selectedCardIndex];

    if (!player) return;

    // 1. Отправляем в Firebase
    const newListingRef = push(ref(db, 'market_listings'));
    set(newListingRef, {
        sellerUid: userData.uid,
        sellerName: userData.nickname,
        price: price,
        card: player,
        timestamp: Date.now()
    });

    // 2. Убираем из состава, если он там был
    let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
    activeSquad = activeSquad.map(slot => (slot && slot.file === player.file) ? null : slot);
    localStorage.setItem('activeSquad', JSON.stringify(activeSquad));

    // 3. Удаляем из своего клуба
    club.splice(selectedCardIndex, 1);
    saveMyClub(club);

    closePriceModal();
    switchMarketTab('my-listings');
};

// 6. СНЯТИЕ С ПРОДАЖИ (ОТМЕНА ЛОТА)
window.cancelListing = function(listingId, cardData) {
    if (confirm("Вы хотите снять эту карточку с продажи и вернуть в клуб?")) {
        // 1. Возвращаем карточку в клуб
        let club = getMyClub();
        club.push(cardData);
        saveMyClub(club);

        // 2. Удаляем с рынка в Firebase
        remove(ref(db, `market_listings/${listingId}`));
    }
};

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    checkPendingPayouts();
    listenGlobalMarket();
    refreshBalanceDisplay();
});