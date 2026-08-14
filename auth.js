import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
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

// ВХОД ЧЕРЕЗ GOOGLE
loginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => checkUser(result.user))
        .catch((err) => alert("Ошибка Google: " + err.message));
});

// ВХОД КАК ГОСТЬ
guestBtn.addEventListener('click', () => {
    signInAnonymously(auth)
        .then((result) => checkUser(result.user))
        .catch((err) => {
            console.error("Ошибка анонимного входа:", err);
            alert("Не удалось зайти гостем: " + err.message);
        });
});

async function checkUser(user) {
    try {
        statusMsg.innerText = "Проверка аккаунта...";
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();

            // 1. Сохраняем основной профиль
            localStorage.setItem('gyaz_user', JSON.stringify(userData));

            // 2. ВОССТАНАВЛИВАЕМ БАЛАНС ДЛЯ ЭКОНОМИКИ
            if (userData.balance !== undefined) {
                localStorage.setItem('fixone_balance', userData.balance.toString());
            }

            // 3. ВОССТАНАВЛИВАЕМ КАРТОЧКИ И КЛУБ
            if (userData.club || userData.cards || userData.inventory) {
                const clubData = userData.club || userData.cards || userData.inventory;
                localStorage.setItem('gyaz_club', JSON.stringify(clubData));
            }

            // 4. ВОССТАНАВЛИВАЕМ СОСТАВ (SQUAD)
            if (userData.squad) {
                localStorage.setItem('gyaz_squad', JSON.stringify(userData.squad));
            }

            statusMsg.innerText = "Успешный вход! Перенаправление...";
            window.location.href = "index.html";
        } else {
            // Если аккаунт действительно новый — показываем форму создания ника
            loginBtn.style.display = 'none';
            guestBtn.style.display = 'none';
            statusMsg.innerText = "Регистрация нового игрока:";
            nickForm.style.display = 'flex';
        }
    } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
        alert("Ошибка авторизации: " + err.message);
    }
}

finishBtn.addEventListener('click', async () => {
    const nick = document.getElementById('nickname-input').value.trim();
    if (nick.length < 3) return alert("Ник слишком короткий!");

    const user = auth.currentUser;
    if (!user) return alert("Ошибка авторизации!");

    // Начальный датасет ТОЛЬКО для НОВОГО игрока
    const userData = {
        uid: user.uid,
        nickname: nick,
        balance: 10000,
        level: 1,
        isGuest: user.isAnonymous,
        club: [],
        squad: {}
    };

    // Записываем в Firebase
    await set(ref(db, 'users/' + user.uid), userData);

    // Полная синхронизация с LocalStorage
    localStorage.setItem('gyaz_user', JSON.stringify(userData));
    localStorage.setItem('fixone_balance', '10000');
    localStorage.setItem('gyaz_club', JSON.stringify([]));
    localStorage.setItem('gyaz_squad', JSON.stringify({}));
    
    window.location.href = "index.html";
});