import { montarMenuUsuario, exibirMenuUsuario } from './components/dropdown.js';
import { montarSeletorGrupo } from './components/group-selector.js';
import { authService } from './services/auth-service.js';
import { groupService } from './services/group-service.js';
import { loadCurrentGroup } from './services/group-context.js';
import { initDonationSystem, updateDonationButtonVisibility } from './services/donation-service.js';


async function incluirHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    const resposta = await fetch('./partial/header.html');
    container.innerHTML = await resposta.text();
    const usuario = await authService.getUsuarioLogado();
    if (!usuario) {
        window.location.href = "./login.html";
        return;
    }

    let grupos = [];
    let grupoAtual = null;

    try {
        [grupos, grupoAtual] = await Promise.all([
            groupService.buscarMeusGrupos(),
            loadCurrentGroup()
        ]);
    } catch (err) {
        console.warn('Não foi possível carregar o contexto de grupos do header:', err);
    }

    const btnRanking = document.querySelector('.btn-ranking');
    btnRanking.addEventListener('click', () => {
        window.location.href = './ranking.html';
    });

    if (usuario?.superAdmin === true) {
        const links = document.querySelector('#header .links');
        const rankingWrapper = btnRanking?.parentElement;

        if (links && rankingWrapper) {
            const adminWrapper = document.createElement('div');
            adminWrapper.innerHTML = `
                <button type="button" class="btn-admin-header">
                    <i class="fa-solid fa-shield-halved"></i>
                    <span class="btn-text">Admin</span>
                </button>
            `;

            const adminButton = adminWrapper.querySelector('.btn-admin-header');
            adminButton?.addEventListener('click', () => {
                window.location.href = './painel-admin.html';
            });

            links.insertBefore(adminWrapper, rankingWrapper.nextSibling);
        }
    }

    montarSeletorGrupo(grupos, grupoAtual);
    montarMenuUsuario(usuario, grupoAtual);
    exibirMenuUsuario();

    // Inicializar sistema de doação
    initDonationSystem();
    updateDonationButtonVisibility(true);
}

async function incluirFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;

    const resposta = await fetch('./partial/footer.html');
    container.innerHTML = await resposta.text();
}

incluirHeader();
incluirFooter();