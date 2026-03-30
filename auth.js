import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

async function loadUserData(uid) {
    const db = getDatabase();
    const snapshot = await get(ref(db, 'users/' + uid));
    
    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Переносим всё из облака в браузер
        if (data.balance !== undefined) localStorage.setItem('fixone_balance', data.balance);
        if (data.inventory) localStorage.setItem('myPlayers', JSON.stringify(data.inventory));
        if (data.squad) localStorage.setItem('activeSquad', JSON.stringify(data.squad));
        
        console.log("Данные успешно загружены из облака!");
    }
}
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
const nickForm = document.getElementById('nick-form');
const finishBtn = document.getElementById('finish-btn');

// 1. Клик по кнопке Google
loginBtn.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => checkUser(result.user))
        .catch((err) => alert("Ошибка: " + err.message));
});

// 2. Проверка: новый игрок или старый?
async function checkUser(user) {
    const userRef = ref(db, 'users/' + user.uid);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        // Игрок уже есть в базе — сохраняем в браузер и заходим
        localStorage.setItem('gyaz_user', JSON.stringify(snapshot.val()));
        window.location.href = "index.html";
    } else {
        // Новый игрок — показываем поле для ника
        loginBtn.style.display = 'none';
        document.getElementById('status-msg').innerText = "Как тебя звать?";
        nickForm.style.display = 'flex';
    }
}

// 3. Завершение регистрации
finishBtn.addEventListener('click', async () => {
    const nick = document.getElementById('nickname-input').value.trim();
    if (nick.length < 3) return alert("Ник слишком короткий!");

    const user = auth.currentUser;
    const userData = {
        uid: user.uid,
        nickname: nick,
        balance: 10000, // Начальный подарок
        level: 1
    };

    // Сохраняем в облако Firebase
    await set(ref(db, 'users/' + user.uid), userData);
    
    // Сохраняем локально и входим
    localStorage.setItem('gyaz_user', JSON.stringify(userData));
    window.location.href = "index.html";
});