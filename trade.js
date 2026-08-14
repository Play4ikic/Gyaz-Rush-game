import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { refreshBalanceDisplay } from './economy.js';

// 1. Инициализация Firebase
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

// 2. Данные пользователя
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "player_" + Math.floor(Math.random() * 10000), 
    nickname: "Игрок #" + Math.floor(Math.random() * 100) 
};

let currentRoomId = null;
let isHost = false;
let selectedMyCard = null;
let roomListener = null;
let tradeExecuted = false;

// Вспомогательные функции взаимодействия с клубом
function getMyClub() {
    return JSON.parse(localStorage.getItem('myPlayers')) || [];
}

function saveMyClub(club) {
    const jsonStr = JSON.stringify(club);
    localStorage.setItem('myPlayers', jsonStr);
    
    if (userData && userData.uid) {
        update(ref(db, `users/${userData.uid}`), { myPlayers: jsonStr });
    }
}

// 3. Создание комнаты обмена
window.createTradeRoom = function() {
    const roomId = Math.floor(100000 + Math.random() * 900000).toString(); // 6-значный код
    currentRoomId = roomId;
    isHost = true;
    tradeExecuted = false;

    const roomRef = ref(db, `trade_rooms/${roomId}`);
    set(roomRef, {
        hostUid: userData.uid,
        hostName: userData.nickname,
        hostCard: null,
        hostReady: false,
        guestUid: null,
        guestName: null,
        guestCard: null,
        guestReady: false,
        status: "waiting", // waiting | active | completed
        createdAt: Date.now()
    }).then(() => {
        setupTradeUI(roomId);
        listenToRoom(roomId);
    });
};

// 4. Подключение к комнате обмена по коду
window.joinTradeRoom = function() {
    const inputCode = document.getElementById('trade-room-code-input');
    const roomId = inputCode ? inputCode.value.trim() : prompt("Введите код комнаты:");

    if (!roomId) {
        alert("Введите код комнаты!");
        return;
    }

    const roomRef = ref(db, `trade_rooms/${roomId}`);
    get(roomRef).then((snapshot) => {
        if (!snapshot.exists()) {
            alert("Комната не найдена!");
            return;
        }

        const data = snapshot.val();
        if (data.guestUid && data.guestUid !== userData.uid) {
            alert("Комната уже заполнена!");
            return;
        }

        currentRoomId = roomId;
        isHost = false;
        tradeExecuted = false;

        update(roomRef, {
            guestUid: userData.uid,
            guestName: userData.nickname,
            status: "active"
        }).then(() => {
            setupTradeUI(roomId);
            listenToRoom(roomId);
        });
    });
};

// 5. Настройка интерфейса комнаты
function setupTradeUI(roomId) {
    const roomCodeDisplay = document.getElementById('current-room-code');
    if (roomCodeDisplay) roomCodeDisplay.innerText = roomId;

    const lobbyPanel = document.getElementById('trade-lobby');
    const roomPanel = document.getElementById('trade-room-active');
    
    if (lobbyPanel) lobbyPanel.style.display = 'none';
    if (roomPanel) roomPanel.style.display = 'block';

    renderMyClubForTrade();
}

// 6. Отрисовка своего клуба для выбора карточки на обмен
function renderMyClubForTrade() {
    const container = document.getElementById('my-trade-inventory');
    if (!container) return;

    const club = getMyClub();
    container.innerHTML = "";

    if (club.length === 0) {
        container.innerHTML = "<p class='empty-msg'>В вашем клубе нет карточек.</p>";
        return;
    }

    club.forEach((player, index) => {
        const folder = player.folder || (player.rating >= 97 ? 'Toty' : 'Champions');
        const imagePath = player.image || `${folder}/${player.file}`;

        const cardEl = document.createElement('div');
        cardEl.className = 'trade-inventory-card';
        cardEl.innerHTML = `<img src="${imagePath}" class="mini-card-img">`;
        
        cardEl.onclick = () => selectCardForTrade(player, cardEl);
        container.appendChild(cardEl);
    });
}

// 7. Выбор карточки для оффера
function selectCardForTrade(player, element) {
    document.querySelectorAll('.trade-inventory-card').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    selectedMyCard = player;

    if (!currentRoomId) return;

    const roomRef = ref(db, `trade_rooms/${currentRoomId}`);
    const updates = isHost ? { hostCard: player, hostReady: false } : { guestCard: player, guestReady: false };
    
    update(roomRef, updates);
}

// 8. Подтверждение готовности (Ready)
window.toggleTradeReady = function() {
    if (!selectedMyCard) {
        alert("Сначала выберите карточку для обмена!");
        return;
    }

    if (!currentRoomId) return;

    const roomRef = ref(db, `trade_rooms/${currentRoomId}`);
    get(roomRef).then((snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const newReadyState = isHost ? !data.hostReady : !data.guestReady;

        const updates = isHost ? { hostReady: newReadyState } : { guestReady: newReadyState };
        update(roomRef, updates);
    });
};

// 9. Прослушивание изменений в комнате в реальном времени
function listenToRoom(roomId) {
    const roomRef = ref(db, `trade_rooms/${roomId}`);
    
    roomListener = onValue(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
            alert("Комната была закрыта.");
            leaveTradeRoom();
            return;
        }

        const data = snapshot.val();
        updateRoomView(data);

        // Проверка готовности обоих участников к обмену
        if (data.hostReady && data.guestReady && !tradeExecuted) {
            tradeExecuted = true;
            processTradeSwap(data);
        }
    });
}

// 10. Обновление внешнего вида комнаты
function updateRoomView(data) {
    const myOfferImg = document.getElementById('my-offer-img');
    const partnerOfferImg = document.getElementById('partner-offer-img');
    const partnerNameEl = document.getElementById('partner-name');
    const readyBtn = document.getElementById('trade-ready-btn');

    const myData = isHost ? { card: data.hostCard, ready: data.hostReady } : { card: data.guestCard, ready: data.guestReady };
    const partnerData = isHost ? { name: data.guestName, card: data.guestCard, ready: data.guestReady } : { name: data.hostName, card: data.hostCard, ready: data.hostReady };

    // Имя партнёра
    if (partnerNameEl) {
        partnerNameEl.innerText = partnerData.name ? partnerData.name : "Ожидание второго игрока...";
    }

    // Моя выбранная карточка
    if (myOfferImg) {
        if (myData.card) {
            const folder = myData.card.folder || (myData.card.rating >= 97 ? 'Toty' : 'Champions');
            myOfferImg.src = myData.card.image || `${folder}/${myData.card.file}`;
            myOfferImg.style.display = 'block';
        } else {
            myOfferImg.style.display = 'none';
        }
    }

    // Карточка партнёра
    if (partnerOfferImg) {
        if (partnerData.card) {
            const folder = partnerData.card.folder || (partnerData.card.rating >= 97 ? 'Toty' : 'Champions');
            partnerOfferImg.src = partnerData.card.image || `${folder}/${partnerData.card.file}`;
            partnerOfferImg.style.display = 'block';
        } else {
            partnerOfferImg.style.display = 'none';
        }
    }

    // Статус кнопки готовности
    if (readyBtn) {
        if (myData.ready) {
            readyBtn.innerText = "ГОТОВ! (Нажмите для отмены)";
            readyBtn.classList.add('is-ready');
        } else {
            readyBtn.innerText = "ПОДТВЕРДИТЬ ОБМЕН";
            readyBtn.classList.remove('is-ready');
        }
    }
}

// 11. Выполнение обмена карточками
function processTradeSwap(roomData) {
    const myGivenCard = isHost ? roomData.hostCard : roomData.guestCard;
    const receivedCard = isHost ? roomData.guestCard : roomData.hostCard;

    executeTradeSwap(myGivenCard, receivedCard);

    alert("🎉 Обмен успешно завершён!");

    // Хост удаляет комнату после обмена
    if (isHost) {
        setTimeout(() => {
            remove(ref(db, `trade_rooms/${currentRoomId}`));
        }, 1500);
    }

    leaveTradeRoom();
}

// 12. Обновление локального хранилища и Firebase при совершении обмена
function executeTradeSwap(myGivenCard, receivedCard) {
    let club = getMyClub();

    // Удаляем отданную карточку
    if (myGivenCard) {
        const index = club.findIndex(p => 
            (p.file && p.file === myGivenCard.file) || 
            (p.name && p.name === myGivenCard.name)
        );
        if (index !== -1) club.splice(index, 1);

        // Если отданная карточка стояла в активном составе — убираем её оттуда
        let activeSquad = JSON.parse(localStorage.getItem('activeSquad')) || [null, null, null, null, null];
        let squadChanged = false;
        activeSquad = activeSquad.map(slot => {
            if (slot && slot.file === myGivenCard.file) {
                squadChanged = true;
                return null;
            }
            return slot;
        });

        if (squadChanged) {
            const squadStr = JSON.stringify(activeSquad);
            localStorage.setItem('activeSquad', squadStr);
            if (userData && userData.uid) {
                update(ref(db, `users/${userData.uid}`), { activeSquad: squadStr });
            }
        }
    }

    // Добавляем полученную карточку
    if (receivedCard) {
        club.push(receivedCard);
    }

    // Сохраняем обновленный клуб локально и отправляем в Firebase Realtime Database
    saveMyClub(club);
}

// 13. Выход из комнаты
window.leaveTradeRoom = function() {
    if (currentRoomId && isHost && !tradeExecuted) {
        remove(ref(db, `trade_rooms/${currentRoomId}`));
    }

    currentRoomId = null;
    isHost = false;
    selectedMyCard = null;
    tradeExecuted = false;

    const lobbyPanel = document.getElementById('trade-lobby');
    const roomPanel = document.getElementById('trade-room-active');
    
    if (lobbyPanel) lobbyPanel.style.display = 'block';
    if (roomPanel) roomPanel.style.display = 'none';

    refreshBalanceDisplay();
};

document.addEventListener('DOMContentLoaded', () => {
    refreshBalanceDisplay();
});