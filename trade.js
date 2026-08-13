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

// Данные пользователя
let userData = JSON.parse(localStorage.getItem('gyaz_user')) || { 
    uid: "player_" + Math.floor(Math.random() * 10000), 
    nickname: "Игрок #" + Math.floor(Math.random() * 100) 
};
localStorage.setItem('gyaz_user', JSON.stringify(userData));

let currentTradeId = null;
let currentTradeData = null;
let selectedMyCard = null;
let isTradeProcessing = false; // Флаг-защита от дюпа и повторного срабатывания

// Поиск карточек в инвентаре
function getMyClubCards() {
    const keys = ['myPlayers', 'myCards', 'gyaz_club', 'playerInventory', 'club_cards'];
    for (let key of keys) {
        const raw = localStorage.getItem(key);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return { storageKey: key, cards: parsed };
                }
            } catch(e) {}
        }
    }
    return { storageKey: 'myPlayers', cards: [] };
}

// 1. Статус Онлайн
function manageStatus() {
    const myStatusRef = ref(db, `all_players/${userData.uid}`);
    update(myStatusRef, { nickname: userData.nickname, online: true });
    onDisconnect(myStatusRef).update({ online: false });
}

// 2. Игроки Онлайн
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
                if (id === userData.uid) return;
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

// 3. Запрос на трейд
window.sendTradeRequest = function(targetUid, targetName) {
    const requestRef = ref(db, `trade_requests/${targetUid}/${userData.uid}`);
    set(requestRef, {
        senderUid: userData.uid,
        senderName: userData.nickname,
        status: "pending"
    });
};

// 4. Приглашения
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

function acceptInvite(senderUid, senderName) {
    document.getElementById('trade-invite-modal').style.display = 'none';
    currentTradeId = `trade_${senderUid}_${userData.uid}`;

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

    remove(ref(db, `trade_requests/${userData.uid}/${senderUid}`));
    openTradeRoom(currentTradeId);
}

function declineInvite(senderUid) {
    document.getElementById('trade-invite-modal').style.display = 'none';
    remove(ref(db, `trade_requests/${userData.uid}/${senderUid}`));
}

function listenForMySentRequests() {
    const allRequestsRef = ref(db, `trade_requests`);
    onValue(allRequestsRef, (snapshot) => {
        if (!snapshot.exists()) return;

        const all = snapshot.val();
        Object.keys(all).forEach(targetUid => {
            if (all[targetUid] && all[targetUid][userData.uid]) {
                const tradeId = `trade_${userData.uid}_${targetUid}`;
                
                onValue(ref(db, `trades/${tradeId}`), (tradeSnap) => {
                    if (tradeSnap.exists() && tradeSnap.val().status === "active") {
                        currentTradeId = tradeId;
                        openTradeRoom(tradeId);
                    }
                });
            }
        });
    });
}

// 5. Комната трейда
function openTradeRoom(tradeId) {
    document.getElementById('trade-room-modal').style.display = 'flex';
    isTradeProcessing = false; // Сбрасываем защиту при открытии

    const roomRef = ref(db, `trades/${tradeId}`);
    onValue(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
            closeTradeRoom();
            return;
        }

        const data = snapshot.val();
        currentTradeData = data;

        if (data.status === "cancelled" || data.status === "completed") {
            closeTradeRoom();
            return;
        }

        const isP1 = userData.uid === data.p1_uid;
        const myKey = isP1 ? 'p1' : 'p2';
        const partnerKey = isP1 ? 'p2' : 'p1';

        document.getElementById('my-name').innerText = data[`${myKey}_name`];
        document.getElementById('partner-name').innerText = data[`${partnerKey}_name`];

        renderCardSlot('my-card-slot', data[`${myKey}_card`]);
        renderCardSlot('partner-card-slot', data[`${partnerKey}_card`]);

        updateStatusBadge('my-status-badge', data[`${myKey}_ready`]);
        updateStatusBadge('partner-status-badge', data[`${partnerKey}_ready`]);

        // БЕЗОПАСНОЕ ЗАВЕРШЕНИЕ БЕЗ ALERT И БЕЗ ДЮПА
        if (data.p1_ready && data.p2_ready && data.status === "active" && !isTradeProcessing) {
            isTradeProcessing = true; // Сразу ставим замок, чтобы код не запустился повторно!

            // 1. Меняем статус в Firebase
            if (isP1) {
                update(ref(db, `trades/${tradeId}`), { status: "completed" });
            }

            // 2. Делаем обмен ровно 1 раз
            executeTradeSwap(data[`${myKey}_card`], data[`${partnerKey}_card`]);

            // 3. Просто тихо закрываем окно обмена
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
    
    let imgSrc = card.image || card.file || "";
    if (card.folder && card.file && !card.image) {
        imgSrc = `${card.folder}/${card.file}`;
    } else if (!card.image && card.file) {
        const folder = card.rating >= 97 ? 'Toty' : 'Champions';
        imgSrc = `${folder}/${card.file}`;
    }

    slot.innerHTML = `
        <img src="${imgSrc}" style="width:100%; height:100%; object-fit:contain;">
        <div style="font-weight:bold; font-size:11px; margin-top:2px;">${card.name || 'Игрок'}</div>
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

// Открытие списка карточек
document.getElementById('select-card-btn').onclick = () => {
    document.getElementById('inventory-modal').style.display = 'flex';
    renderMyClubCards();
};

window.closeInventory = function() {
    document.getElementById('inventory-modal').style.display = 'none';
};

function renderMyClubCards() {
    const container = document.getElementById('club-cards-container');
    container.innerHTML = "";

    const { cards } = getMyClubCards();

    if (cards.length === 0) {
        container.innerHTML = "<p style='color:#aaa;'>У вас нет доступных карточек в клубе!</p>";
        return;
    }

    cards.forEach((player) => {
        let imgSrc = player.image || player.file || "";
        if (player.folder && player.file && !player.image) {
            imgSrc = `${player.folder}/${player.file}`;
        } else if (!player.image && player.file) {
            const folder = player.rating >= 97 ? 'Toty' : 'Champions';
            imgSrc = `${folder}/${player.file}`;
        }

        const item = document.createElement('div');
        item.className = 'pickable-card';
        item.innerHTML = `
            <img src="${imgSrc}" style="width:100%; height:90px; object-fit:contain;">
            <div style="font-size:11px; font-weight:bold; color:#fff; margin-top:4px;">${player.name || 'Игрок'}</div>
        `;
        item.onclick = () => pickCardForTrade(player);
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

    update(ref(db, `trades/${currentTradeId}`), {
        [cardKey]: card,
        [readyKey]: false
    });
}

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

// Точный обмен 1 к 1 без дублирования
function executeTradeSwap(myGivenCard, receivedCard) {
    const { storageKey, cards } = getMyClubCards();
    let club = [...cards];

    // Удаляем отданную карточку
    if (myGivenCard) {
        const index = club.findIndex(p => 
            (p.file && p.file === myGivenCard.file) || 
            (p.name && p.name === myGivenCard.name)
        );
        if (index !== -1) club.splice(index, 1);
    }

    // Добавляем полученную
    if (receivedCard) {
        club.push(receivedCard);
    }

    // Сохраняем в память
    localStorage.setItem(storageKey, JSON.stringify(club));
    localStorage.setItem('myPlayers', JSON.stringify(club));
}

// Запуск
manageStatus();
renderOnlinePlayers();
listenForInvites();
listenForMySentRequests();