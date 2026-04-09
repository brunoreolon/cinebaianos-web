import { groupService } from '../services/group-service.js';
import { setFlashMessage } from '../services/group-context.js';
import { criarMensagem } from './mensagens.js';
import { MensagemTipo } from './mensagem-tipo.js';
import { ApiError } from '../exception/api-error.js';

function closeGroupDropdown(wrapper) {
    wrapper?.querySelector('.group-dropdown')?.classList.remove('active');
}

export function montarSeletorGrupo(grupos = [], grupoAtual = null) {
    const container = document.getElementById('group-selector-container');
    if (!container) return;

    if (!grupos.length) {
        container.innerHTML = `
            <a class="btn-group-selector btn-group-selector-empty" href="./meus-grupos.html">
                <i class="fa-regular fa-star"></i>
                <span>Meus grupos</span>
            </a>
        `;
        return;
    }

    const nomeGrupoAtual = grupoAtual?.name || 'Selecionar grupo';

    container.innerHTML = `
        <div class="group-selector-actions">
            ${grupoAtual?.id ? `
                <a class="btn-group-current" href="./detalhes-grupo.html?id=${grupoAtual.id}" title="Abrir detalhes do grupo atual" aria-label="Abrir detalhes do grupo atual">
                    <i class="fa-solid fa-people-group"></i>
                </a>
            ` : ''}
            <div class="group-switcher">
                <button type="button" class="btn-group-selector" aria-label="Selecionar grupo">
                    <i class="fa-solid fa-star ${grupoAtual ? 'is-selected' : ''}"></i>
                    <span class="btn-group-selector-text">${nomeGrupoAtual}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div class="group-dropdown border">
                    <div class="group-dropdown-header">
                        <span>Trocar grupo</span>
                    </div>
                    <ul class="group-dropdown-list"></ul>
                    <div class="separator"></div>
                    <a class="group-dropdown-link" href="./meus-grupos.html">
                        <i class="fa-solid fa-layer-group space"></i>
                        <span>Meus grupos</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    const wrapper = container.querySelector('.group-switcher');
    const button = wrapper.querySelector('.btn-group-selector');
    const dropdown = wrapper.querySelector('.group-dropdown');
    const list = wrapper.querySelector('.group-dropdown-list');

    grupos.forEach(group => {
        const isSelected = grupoAtual?.id === group.id;
        const item = document.createElement('li');
        item.className = `group-dropdown-item ${isSelected ? 'selected' : ''}`;

        item.innerHTML = `
            <button type="button" class="group-dropdown-button" data-group-id="${group.id}" ${isSelected ? 'disabled' : ''}>
                <span class="group-dropdown-main">
                    <i class="fa-${isSelected ? 'solid' : 'regular'} fa-star group-dropdown-star ${isSelected ? 'is-selected' : ''}"></i>
                    <span class="group-dropdown-labels">
                        <strong>${group.name}</strong>
                        <small>#${group.tag}</small>
                    </span>
                </span>
                ${isSelected ? '<span class="group-dropdown-current">Atual</span>' : ''}
            </button>
        `;

        const action = item.querySelector('.group-dropdown-button');
        action?.addEventListener('click', async () => {
            try {
                await groupService.definirGrupoPadrao(group.id);
                setFlashMessage(`Grupo "${group.name}" definido como grupo atual.`, 'SUCCESS');
                window.location.reload();
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || 'Não foi possível trocar o grupo.', MensagemTipo.ERROR);
                } else {
                    criarMensagem('Erro de conexão ao trocar o grupo.', MensagemTipo.ERROR);
                }
            }
        });

        list.appendChild(item);
    });

    button.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    dropdown.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', e => {
        if (!wrapper.contains(e.target)) {
            closeGroupDropdown(wrapper);
        }
    });
}

