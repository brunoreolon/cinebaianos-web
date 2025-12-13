import { login } from '../auth.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';
import { ApiError } from '../exception/api-error.js';

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
        if (err instanceof ApiError) {
            switch (err.errorCode) {
                case "invalid_credentials":
                    criarMensagem("Usuário ou senha incorretos.", MensagemTipo.ERROR);
                    break;
                default:
                    criarMensagem(err.detail || "Erro ao realizar login.", MensagemTipo.ERROR);
            }
        } else {
            criarMensagem("Não foi possível conectar ao servidor. Tente novamente.", MensagemTipo.ERROR);
        }
    }
});