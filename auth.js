import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously // ПРОВЕРЬ ЭТОТ ИМПОРТ
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
        .then((result) => {
            // Скрываем выбор входа
            loginBtn.style.display = 'none';
            guestBtn.style.display = 'none';
            // Показываем поле ника
            statusMsg.innerText = "Вход выполнен (Гость). Как тебя звать?";
            nickForm.style.display = 'flex';
        })
        .catch((err) => {
            console.error("Ошибка анонимного входа:", err);
            alert("Не удалось зайти гостем: " + err.message);
        });
});

async function checkUser(user) {
    const userRef = ref(db, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        localStorage.setItem('gyaz_user', JSON.stringify(snapshot.val()));
        window.location.href = "index.html";
    } else {
        loginBtn.style.display = 'none';
        guestBtn.style.display = 'none';
        statusMsg.innerText = "Регистрация нового игрока:";
        nickForm.style.display = 'flex';
    }
}

finishBtn.addEventListener('click', async () => {
    const nick = document.getElementById('nickname-input').value.trim();
    if (nick.length < 3) return alert("Ник слишком короткий!");

    const user = auth.currentUser;
    const userData = {
        uid: user.uid,
        nickname: nick,
        balance: 10000,
        level: 1,
        isGuest: user.isAnonymous
    };

    await set(ref(db, 'users/' + user.uid), userData);
    localStorage.setItem('gyaz_user', JSON.stringify(userData));
    localStorage.setItem('fixone_balance', '10000'); // Синхронизация с экономикой
    
    window.location.href = "index.html";
});