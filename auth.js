import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com",
    storageBucket: "play4ik-473ef.firebasestorage.app",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1",
    measurementId: "G-0FNY94SDH5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginBtn = document.getElementById('login-btn');
const guestBtn = document.getElementById('guest-btn');
const nickForm = document.getElementById('nick-form');
const finishBtn = document.getElementById('finish-btn');
const statusMsg = document.getElementById('status-msg');

onAuthStateChanged(auth, (user) => {
    if (user) {
        checkUser(user);
    }
});

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => checkUser(result.user))
            .catch((err) => alert("Ошибка Google: " + err.message));
    });
}

if (guestBtn) {
    guestBtn.addEventListener('click', () => {
        signInAnonymously(auth)
            .then((result) => checkUser(result.user))
            .catch((err) => {
                console.error("Ошибка анонимного входа:", err);
                alert("Не удалось зайти гостем: " + err.message);
            });
    });
}

async function checkUser(user) {
    try {
        if (statusMsg) statusMsg.innerText = "Загрузка профиля и карточек...";
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val() || {};
            userData.uid = user.uid; // Принудительно вшиваем UID

            localStorage.setItem('gyaz_user', JSON.stringify(userData));
            if (userData.nickname) {
                localStorage.setItem('gyaz_player_nickname', userData.nickname);
            }

            if (userData.balance !== undefined) {
                localStorage.setItem('fixone_balance', userData.balance.toString());
            }
            if (userData.fixone_sig) {
                localStorage.setItem('fixone_sig', userData.fixone_sig);
            }

            // КАРТОЧКИ ИГРОКА (КЛУБ)
            if (userData.myPlayers !== undefined) {
                const playersStr = typeof userData.myPlayers === 'string' 
                    ? userData.myPlayers 
                    : JSON.stringify(userData.myPlayers);
                localStorage.setItem('myPlayers', playersStr);
            }

            // АКТИВНЫЙ СОСТАВ (SQUAD)
            if (userData.activeSquad !== undefined) {
                const squadStr = typeof userData.activeSquad === 'string' 
                    ? userData.activeSquad 
                    : JSON.stringify(userData.activeSquad);
                localStorage.setItem('activeSquad', squadStr);
            }

            if (userData.playerXP !== undefined) {
                localStorage.setItem('playerXP', userData.playerXP.toString());
            }
            if (userData.claimedRewards) {
                const rewardsStr = typeof userData.claimedRewards === 'string' 
                    ? userData.claimedRewards 
                    : JSON.stringify(userData.claimedRewards);
                localStorage.setItem('claimedRewards', rewardsStr);
            }

            if (userData.gyaz_used_promos) {
                const promosStr = typeof userData.gyaz_used_promos === 'string'
                    ? userData.gyaz_used_promos
                    : JSON.stringify(userData.gyaz_used_promos);
                localStorage.setItem('gyaz_used_promos', promosStr);
            }
            if (userData.last_daily_claim) {
                localStorage.setItem('last_daily_claim', userData.last_daily_claim.toString());
            }

            if (statusMsg) statusMsg.innerText = "Успешный вход! Загрузка...";
            window.location.href = "index.html";
        } else {
            if (loginBtn) loginBtn.style.display = 'none';
            if (guestBtn) guestBtn.style.display = 'none';
            if (statusMsg) statusMsg.innerText = "Регистрация нового игрока:";
            if (nickForm) nickForm.style.display = 'flex';
        }
    } catch (err) {
        console.error("Ошибка при проверке пользователя:", err);
        alert("Ошибка входа: " + err.message);
    }
}

if (finishBtn) {
    finishBtn.addEventListener('click', async () => {
        const nickInput = document.getElementById('nickname-input');
        const nick = nickInput ? nickInput.value.trim() : "";
        
        if (nick.length < 3) return alert("Ник слишком короткий (минимум 3 символа)!");

        const user = auth.currentUser;
        if (!user) return alert("Ошибка авторизации!");

        finishBtn.disabled = true;
        finishBtn.innerText = "Создание...";

        const userData = {
            uid: user.uid,
            nickname: nick,
            balance: 10000,
            level: 1,
            isGuest: user.isAnonymous,
            myPlayers: "[]",
            activeSquad: "[]",
            playerXP: "0",
            claimedRewards: "[]",
            gyaz_used_promos: "[]"
        };

        try {
            await set(ref(db, 'users/' + user.uid), userData);

            localStorage.setItem('gyaz_user', JSON.stringify(userData));
            localStorage.setItem('gyaz_player_nickname', nick);
            localStorage.setItem('fixone_balance', '10000');
            localStorage.setItem('myPlayers', '[]');
            localStorage.setItem('activeSquad', '[]');
            localStorage.setItem('playerXP', '0');
            localStorage.setItem('claimedRewards', '[]');
            localStorage.setItem('gyaz_used_promos', '[]');

            window.location.href = "index.html";
        } catch (err) {
            console.error("Ошибка регистрации:", err);
            alert("Не удалось сохранить профиль: " + err.message);
            finishBtn.disabled = false;
            finishBtn.innerText = "Завершить";
        }
    });
}