import { login } from '../auth.js';

const form = document.querySelector('.login-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.querySelector('#email').value;
    const password = document.querySelector('#senha').value;
    const remember = document.querySelector('#remember').checked; // pega checkbox

    try {
        await login(username, password, remember);
        window.location.href = "./index.html";
    } catch (err) {
        alert("Erro no login: " + err.message);
    }
});