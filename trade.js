import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

// Получаем текущего пользователя
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "player_" + Math.floor(Math.random() * 10000), 
    nickname: "Игрок #" + Math.floor(Math.random() * 100) 
};
localStorage.setItem('gyaz_user', JSON.stringify(userData));

let currentTradeId = null;
let currentTradeData = null;
let selectedMyCard = null;
let isHost = false; // Определение, кто создал трейд

// 1. Онлайн статус
function manageStatus() {
    const myStatusRef = ref(db, `all_players/${userData.uid}`);
    update(myStatusRef, { nickname: userData.nickname, online: true });
    onDisconnect(myStatusRef).update({ online: false });
}

// 2. Отображение списка игроков для трейда
function renderOnlinePlayers() {
    const listRef = ref(db, 'all_players');
    const container = document.getElementById('online-trade-list');

    onValue(listRef, (snapshot) => {
        if (!container) return;
        container.innerHTML = "";

        if (snapshot.exists()) {
            const players = snapshot.val();
            let count = 0;

            Object.keys(players).forEach(id => {
                if (id === userData.uid) return; // Не показываем самого себя
                const player = players[id];

                if (player.online) {
                    count++;
                    const row = document.createElement('div');
                    row.className = 'player-row';
                    row.innerHTML = `
                        <span style="font-weight: bold; color: #fff;">⚽ ${player.nickname}</span>
                        <button class="trade-invite-btn" onclick="sendTradeRequest('${id}', '${player.nickname}')">
                            Предложить трейд
                        </button>
                    `;
                    container.appendChild(row);
                }
            });

            if (count === 0) {
                container.innerHTML = "<p style='color: #777;'>Сейчас нет других игроков в сети</p>";
            }
        }
    });
}

// 3. Отправка предложения
window.sendTradeRequest = function(targetUid, targetName) {
    const requestRef = ref(db, `trade_requests/${targetUid}/${userData.uid}`);
    set(requestRef, {
        senderUid: userData.uid,
        senderName: userData.nickname,
        status: "pending"
    });
    alert(`Запрос отправлен игроку ${targetName}! Ожидайте ответа...`);
};

// 4. Прослушивание входящих приглашений
function listenForInvites() {
    const myInvitesRef = ref(db, `trade_requests/${userData.uid}`);

    onValue(myInvitesRef, (snapshot) => {
        if (snapshot.exists()) {
            const requests = snapshot.val();
            const senderUid = Object.keys(requests)[0];
            const reqData = requests[senderUid];

            if (reqData && reqData.status === "pending") {
                document.getElementById('invite-sender-title').innerText = `Трейд от ${reqData.senderName}`;
                document.getElementById('trade-invite-modal').style.display = 'flex';

                document.getElementById('accept-invite-btn').onclick = () => acceptInvite(senderUid, reqData.senderName);
                document.getElementById('decline-invite-btn').onclick = () => declineInvite(senderUid);
            }
        }
    });
}

// Принять приглашение
function acceptInvite(senderUid, senderName) {
    document.getElementById('trade-invite-modal').style.display = 'none';
    
    // Создаем общую комнату трейда
    currentTradeId = `trade_${senderUid}_${userData.uid}`;
    isHost = false;

    const tradeRoomRef = ref(db, `trades/${currentTradeId}`);
    set(tradeRoomRef, {
        p1_uid: senderUid,
        p1_name: senderName,
        p1_card: null,
        p1_ready: false,
        p2_uid: userData.uid,
        p2_name: userData.nickname,
        p2_card: null,
        p2_ready: false,
        status: "active"
    });

    // Удаляем запрос
    remove(ref(db, `trade_requests/${userData.uid}/${senderUid}`));

    // Открываем окно трейда
    openTradeRoom(currentTradeId);
}

// Отклонить
function declineInvite(senderUid) {
    document.getElementById('trade-invite-modal').style.display = 'none';
    remove(ref(db, `trade_requests/${userData.uid}/${senderUid}`));
}

// Прослушивание ответа от соперника (для того, кто отправлял)
function listenForMySentRequests() {
    const allRequestsRef = ref(db, `trade_requests`);
    onValue(allRequestsRef, (snapshot) => {
        if (!snapshot.exists()) return;

        const all = snapshot.val();
        Object.keys(all).forEach(targetUid => {
            if (all[targetUid][userData.uid]) {
                const myReq = all[targetUid][userData.uid];
                // Если создана комната трейда
                const tradeId = `trade_${userData.uid}_${targetUid}`;
                
                onValue(ref(db, `trades/${tradeId}`), (tradeSnap) => {
                    if (tradeSnap.exists() && tradeSnap.val().status === "active") {
                        currentTradeId = tradeId;
                        isHost = true;
                        openTradeRoom(tradeId);
                    }
                });
            }
        });
    });
}

// 5. Логика Комнаты Трейда
function openTradeRoom(tradeId) {
    document.getElementById('trade-room-modal').style.display = 'flex';

    const roomRef = ref(db, `trades/${tradeId}`);
    onValue(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
            closeTradeRoom();
            return;
        }

        const data = snapshot.val();
        currentTradeData = data;

        if (data.status === "cancelled") {
            alert("Трейд был отменен!");
            closeTradeRoom();
            return;
        }

        const isP1 = userData.uid === data.p1_uid;
        const myKey = isP1 ? 'p1' : 'p2';
        const partnerKey = isP1 ? 'p2' : 'p1';

        // Имена
        document.getElementById('my-name').innerText = data[`${myKey}_name`];
        document.getElementById('partner-name').innerText = data[`${partnerKey}_name`];

        // Моя карточка
        renderCardSlot('my-card-slot', data[`${myKey}_card`]);
        // Карточка соперника
        renderCardSlot('partner-card-slot', data[`${partnerKey}_card`]);

        // Статусы готовности
        updateStatusBadge('my-status-badge', data[`${myKey}_ready`]);
        updateStatusBadge('partner-status-badge', data[`${partnerKey}_ready`]);

        // ПРОВЕРКА ЗАВЕРШЕНИЯ ОБМЕНА
        if (data.p1_ready && data.p2_ready && data.status === "active") {
            executeTradeSwap(data[`${myKey}_card`], data[`${partnerKey}_card`]);
            
            // Фиксируем завершение
            if (isP1) {
                update(ref(db, `trades/${tradeId}`), { status: "completed" });
            }

            alert("🎉 ОБМЕН УСПЕШНО СОВЕРШЕН!");
            closeTradeRoom();
        }
    });
}

function renderCardSlot(elementId, card) {
    const slot = document.getElementById(elementId);
    if (!card) {
        slot.innerHTML = `<span style="color:#666; font-size: 12px;">Пусто</span>`;
        return;
    }
    slot.innerHTML = `
        <img src="${card.image || 'images/default_card.png'}" alt="card">
        <div style="font-weight:bold; font-size:12px; margin-top:4px;">${card.name || 'Карточка'}</div>
    `;
}

function updateStatusBadge(elementId, isReady) {
    const badge = document.getElementById(elementId);
    if (isReady) {
        badge.innerText = "ГОТОВ";
        badge.className = "status-badge status-ok";
    } else {
        badge.innerText = "Не готов";
        badge.className = "status-badge status-wait";
    }
}

// Выбор карточки
document.getElementById('select-card-btn').onclick = () => {
    document.getElementById('inventory-modal').style.display = 'flex';
    renderMyClubCards();
};

window.closeInventory = function() {
    document.getElementById('inventory-modal').style.display = 'none';
};

// Получение карточек игрока из localStorage
function renderMyClubCards() {
    const container = document.getElementById('club-cards-container');
    container.innerHTML = "";

    // Получаем карточки игрока из localStorage (поддерживает разные ключи)
    const clubData = JSON.parse(localStorage.getItem('gyaz_club')) || 
                     JSON.parse(localStorage.getItem('myCards')) || 
                     JSON.parse(localStorage.getItem('club_cards')) || [];

    if (clubData.length === 0) {
        container.innerHTML = "<p style='color:#aaa;'>У вас нет доступных карточек в клубе!</p>";
        return;
    }

    clubData.forEach((card, index) => {
        const item = document.createElement('div');
        item.className = 'pickable-card';
        item.innerHTML = `
            <img src="${card.image || 'images/default_card.png'}" style="width:100%; height:90px; object-fit:contain;">
            <div style="font-size:11px; font-weight:bold; color:#fff;">${card.name || 'Игрок'}</div>
        `;
        item.onclick = () => pickCardForTrade(card);
        container.appendChild(item);
    });
}

function pickCardForTrade(card) {
    selectedMyCard = card;
    closeInventory();

    if (!currentTradeId) return;

    const isP1 = currentTradeData.p1_uid === userData.uid;
    const cardKey = isP1 ? 'p1_card' : 'p2_card';
    const readyKey = isP1 ? 'p1_ready' : 'p2_ready';

    // При выборе карточки сбрасываем состояние готовности
    update(ref(db, `trades/${currentTradeId}`), {
        [cardKey]: card,
        [readyKey]: false
    });
}

// Нажать "ГОТОВ"
document.getElementById('confirm-trade-btn').onclick = () => {
    if (!currentTradeId || !currentTradeData) return;

    const isP1 = currentTradeData.p1_uid === userData.uid;
    const myCard = isP1 ? currentTradeData.p1_card : currentTradeData.p2_card;

    if (!myCard) {
        alert("Сначала выберите карточку для обмена!");
        return;
    }

    const readyKey = isP1 ? 'p1_ready' : 'p2_ready';
    const currentReadyState = isP1 ? currentTradeData.p1_ready : currentTradeData.p2_ready;

    update(ref(db, `trades/${currentTradeId}`), {
        [readyKey]: !currentReadyState
    });
};

// Отменить трейд
document.getElementById('cancel-trade-btn').onclick = () => {
    if (currentTradeId) {
        update(ref(db, `trades/${currentTradeId}`), { status: "cancelled" });
    }
};

function closeTradeRoom() {
    document.getElementById('trade-room-modal').style.display = 'none';
    currentTradeId = null;
    currentTradeData = null;
    selectedMyCard = null;
}

// 6. Обмен карточками в localStorage
function executeTradeSwap(myGivenCard, receivedCard) {
    let club = JSON.parse(localStorage.getItem('gyaz_club')) || 
               JSON.parse(localStorage.getItem('myCards')) || [];

    // 1. Удаляем проданную карточку
    if (myGivenCard) {
        const index = club.findIndex(c => c.name === myGivenCard.name || c.id === myGivenCard.id);
        if (index !== -1) club.splice(index, 1);
    }

    // 2. Добавляем полученную карточку
    if (receivedCard) {
        club.push(receivedCard);
    }

    // Сохраняем обновленный клуб
    localStorage.setItem('gyaz_club', JSON.stringify(club));
    localStorage.setItem('myCards', JSON.stringify(club));
}

// Запуск
manageStatus();
renderOnlinePlayers();
listenForInvites();
listenForMySentRequests();