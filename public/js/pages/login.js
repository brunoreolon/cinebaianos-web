import {  authService } from '../services/auth-service.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';
import { ApiError } from '../exception/api-error.js';

document.addEventListener('DOMContentLoaded', () => {
    const flash = sessionStorage.getItem("flashMessage");
    if (flash) {
        const { texto, tipo } = JSON.parse(flash);
        criarMensagem(texto, MensagemTipo[tipo]);
        sessionStorage.removeItem("flashMessage");
    }

    // ====== VIEWS ======
    const loginView = document.getElementById("login-view");
    const recoverView = document.getElementById("recover-view");
    const resetView = document.getElementById("reset-view");

    // ====== FORMS ======
    const loginForm = document.getElementById("form-login");
    const recoverForm = document.getElementById("form-recover");
    const resetForm = document.getElementById("form-reset");

    // ====== INPUTS ======
    const loginEmail = document.getElementById("login-email");
    const loginSenha = document.getElementById("login-senha");
    const remember = document.getElementById("remember");
    const recoverEmail = document.getElementById("recover-email");

    // ====== BOTÕES ======
    const btnForgot = document.getElementById("btn-forgot");
    const btnBack = document.getElementById("btn-back");

    // ====== FUNÇÕES DE NAVEGAÇÃO ======
    function showLoginView() {
        loginForm.reset();
        recoverForm.reset();

        if(loginView) loginView.classList.add("active");
        if(recoverView) recoverView.classList.remove("active");
        if(resetView) resetView.classList.remove("active");
    }

    function showRecoverView() {
        recoverForm.reset();

        if(loginView) loginView.classList.remove("active");
        if(recoverView) recoverView.classList.add("active");
        if(resetView) resetView.classList.remove("active");
    }

    function showResetView() {
        loginForm.reset();
        recoverForm.reset();

        if(loginView) loginView.classList.remove("active");
        if(recoverView) recoverView.classList.remove("active");
        if(resetView) resetView.classList.add("active");
    }

    // ====== EVENTOS DE NAVEGAÇÃO ======
    if(btnForgot) btnForgot.addEventListener("click", showRecoverView);
    if(btnBack) btnBack.addEventListener("click", showLoginView);

    // ====== LOGIN ======
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await authService.login(loginEmail.value, loginSenha.value, remember.checked);
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
                    criarMensagem("Não foi possível conectar ao servidor.", MensagemTipo.ERROR);
                }
            }
        });
    }

    // ====== RECUPERAÇÃO DE SENHA ======
    if(recoverForm) {
        recoverForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!recoverEmail.value.trim()) {
                criarMensagem("Email é obrigatório.", MensagemTipo.ERROR);
                return;
            }

            try {
                await authService.recuperarLogin(recoverEmail.value);
                criarMensagem("Se o email existir, enviaremos instruções para redefinir sua senha.", MensagemTipo.SUCCESS);
                showLoginView();
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || "Erro ao solicitar recuperação de senha.", MensagemTipo.ERROR);
                } else {
                    criarMensagem("Não foi possível conectar ao servidor.", MensagemTipo.ERROR);
                }
            }
        });
    }

    // ====== REDEFINIÇÃO DE SENHA ======
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if(token && resetView) {
        showResetView();
        const resetTokenInput = document.getElementById('reset-token');
        if(resetTokenInput) resetTokenInput.value = token;
    }

    if(resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('reset-password').value;
            const confirm = document.getElementById('reset-password-confirm').value;
            const tokenValue = document.getElementById('reset-token').value;

            if(password !== confirm) {
                criarMensagem('As senhas não conferem!', MensagemTipo.ERROR);
                return;
            }

            try {
                await authService.redefinirSenha(tokenValue, password);
                criarMensagem('Senha redefinida com sucesso!', MensagemTipo.SUCCESS);
                showLoginView();
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || "Erro ao redefinir senha.", MensagemTipo.ERROR);
                } else {
                    criarMensagem("Não foi possível conectar ao servidor.", MensagemTipo.ERROR);
                }
            }
        });
    }
});