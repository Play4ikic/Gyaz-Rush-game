import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDq3-wPkua6nMUt3cetwwC_-4iVtx-7PiQ",
    authDomain: "play4ik-473ef.firebaseapp.com",
    projectId: "play4ik-473ef",
    databaseURL: "https://play4ik-473ef-default-rtdb.firebaseio.com",
    storageBucket: "play4ik-473ef.appspot.com",
    messagingSenderId: "115893557892",
    appId: "1:115893557892:web:731ac77c3f00328c1200d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

window.loginWithGoogle = function() {
    signInWithPopup(auth, provider).then((result) => {
        const user = result.user;
        // Создаем объект пользователя локально, если его нет
        const userData = {
            uid: user.uid,
            nickname: user.displayName,
            balance: 20000 // Стартовый баланс
        };
        localStorage.setItem('gyaz_user', JSON.stringify(userData));
        localStorage.setItem('fixone_balance', 20000);
        window.location.href = "hub.html";
    }).catch((error) => {
        alert("Ошибка входа! Проверь 'Authorized Domains' в Firebase. Код: " + error.code);
    });
};