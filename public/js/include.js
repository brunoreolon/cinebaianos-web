import { montarMenuUsuario, exibirMenuUsuario } from './components/dropdown.js';
import { getUsuarioLogado } from './auth.js';


async function incluirHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    const resposta = await fetch('./partial/header.html');
    const html = await resposta.text();

    container.innerHTML = html;
    const usuario = await getUsuarioLogado();
    if (!usuario) {
        window.location.href = "./login.html";
        return;
    }

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