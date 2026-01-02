import { montarMenuUsuario, exibirMenuUsuario } from './components/dropdown.js';
import { authService } from './services/auth-service.js';


async function incluirHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    const resposta = await fetch('./partial/header.html');
    const html = await resposta.text();

    container.innerHTML = html;
    const usuario = await authService.getUsuarioLogado();
    if (!usuario) {
        window.location.href = "./login.html";
        return;
    }

    const btnRanking = document.querySelector('.btn-ranking');
    btnRanking.addEventListener('click', () => {
        window.location.href = './ranking.html';
    });

    montarMenuUsuario(usuario);
    exibirMenuUsuario();
}

async function incluirFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;

    const resposta = await fetch('./partial/footer.html');
    const html = await resposta.text();

    container.innerHTML = html;
}

incluirHeader();
incluirFooter();