import { authService } from '../services/auth-service.js';
import { loadCurrentGroup } from '../services/group-context.js';

async function incluirFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;

    const resposta = await fetch('./partial/footer.html');
    container.innerHTML = await resposta.text();
}

function initMobileNav() {
    const toggle = document.getElementById('landing-nav-toggle');
    const nav = document.getElementById('landing-nav');
    if (!toggle || !nav) return;

    const closeNav = () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const shouldOpen = !nav.classList.contains('is-open');
        nav.classList.toggle('is-open', shouldOpen);
        toggle.classList.toggle('is-open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
    });

    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeNav);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 760) {
            closeNav();
        }
    });
}

function initFaqAccordion() {
    const perguntas = document.querySelectorAll('.landing-faq-question');
    perguntas.forEach(button => {
        button.addEventListener('click', () => {
            const item = button.closest('.landing-faq-item');
            const alreadyOpen = item?.classList.contains('is-open');

            document.querySelectorAll('.landing-faq-item.is-open').forEach(openItem => {
                openItem.classList.remove('is-open');
                openItem.querySelector('.landing-faq-question')?.setAttribute('aria-expanded', 'false');
            });

            if (!item || alreadyOpen) {
                return;
            }

            item.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
        });
    });
}

function atualizarAcoes(containerId, primaryAction, secondaryAction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(primaryAction);
    container.appendChild(secondaryAction);
}

function createActionLink(href, text, className) {
    const link = document.createElement('a');
    link.href = href;
    link.className = `landing-btn ${className}`;
    link.textContent = text;
    return link;
}

async function ajustarCtasParaUsuarioLogado() {
    if (!authService.isLoggedIn()) {
        return;
    }

    try {
        const usuario = await authService.getUsuarioLogado();
        if (!usuario) return;

        const grupoAtual = await loadCurrentGroup();
        const primary = grupoAtual?.id
            ? createActionLink('./catalogo.html', 'Continuar no catálogo', 'landing-btn-primary')
            : createActionLink('./meus-grupos.html', 'Escolher um grupo', 'landing-btn-primary');

        const secondary = grupoAtual?.id
            ? createActionLink(`./detalhes-grupo.html?id=${grupoAtual.id}`, 'Abrir grupo atual', 'landing-btn-secondary')
            : createActionLink('./meus-grupos.html', 'Ver meus grupos', 'landing-btn-secondary');

        atualizarAcoes('landing-hero-actions', primary.cloneNode(true), secondary.cloneNode(true));
        atualizarAcoes('landing-final-actions', primary, secondary);
    } catch (err) {
        console.warn('Não foi possível personalizar a landing para o usuário logado:', err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initMobileNav();
    initFaqAccordion();
    await incluirFooter();
    await ajustarCtasParaUsuarioLogado();
});

