import { authService } from '../services/auth-service.js';
import { groupService } from '../services/group-service.js';
import { getCurrentGroup, loadCurrentGroup, setFlashMessage } from '../services/group-context.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';
import { renderGroupPreviewCard } from '../components/group-preview-card.js';

let usuarioLogado = null;

const CREATE_GROUP_LIMITS = {
    tag: 6,
    slug: 30
};

const CREATE_GROUP_PATTERNS = {
    tag: /^[A-Z0-9_]{4,6}$/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
};

const createGroupState = {
    debounceId: null,
    requestId: 0,
    closeTimerId: null,
    availability: {
        tag: createEmptyAvailabilityState(),
        slug: createEmptyAvailabilityState()
    }
};

function createEmptyAvailabilityState(value = '') {
    return {
        value,
        available: null,
        checking: false,
        error: false
    };
}

function slugifyGroupName(value) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);
}

function gerarTagGrupo(value) {
    const sanitized = (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9_]/g, '')
        .toUpperCase();

    return sanitized.slice(0, 6);
}

function exibirFlashMessage() {
    const flash = sessionStorage.getItem('flashMessage');
    if (!flash) return;

    const { texto, tipo } = JSON.parse(flash);
    criarMensagem(texto, MensagemTipo[tipo]);
    sessionStorage.removeItem('flashMessage');
}

function getJoinPolicyLabel(joinPolicy) {
    const labels = {
        OPEN: 'Aberto',
        REQUEST: 'Solicitação',
        INVITE_ONLY: 'Somente convite'
    };

    return labels[joinPolicy] || joinPolicy || 'Não informado';
}

function getVisibilityLabel(visibility) {
    const labels = {
        PUBLIC: 'Público',
        PRIVATE: 'Privado'
    };

    return labels[visibility] || visibility || 'Não informado';
}

function getRoleMeta(role) {
    const roles = {
        OWNER: {
            icon: 'fa-solid fa-crown',
            label: 'Dono',
            css: 'role-owner'
        },
        ADMIN: {
            icon: 'fa-solid fa-shield',
            label: 'Admin',
            css: 'role-admin'
        },
        MEMBER: {
            icon: 'fa-regular fa-user',
            label: 'Membro',
            css: 'role-member'
        }
    };

    return roles[role] || roles.MEMBER;
}

function sortGroupsByRoleAndName(groups) {
    const weight = {
        OWNER: 0,
        ADMIN: 1,
        MEMBER: 2
    };

    return [...groups].sort((a, b) => {
        const roleDiff = (weight[a.membership?.role] ?? 99) - (weight[b.membership?.role] ?? 99);
        if (roleDiff !== 0) return roleDiff;

        return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
    });
}

function groupMyGroupsByRole(groups) {
    const grouped = {
        OWNER: [],
        ADMIN: [],
        MEMBER: [],
        OTHER: []
    };

    sortGroupsByRoleAndName(groups).forEach(group => {
        const role = group.membership?.role;
        if (grouped[role]) {
            grouped[role].push(group);
            return;
        }

        grouped.OTHER.push(group);
    });

    return grouped;
}

function getRoleSectionLabel(role) {
    const labels = {
        OWNER: 'Grupos em que sou dono',
        ADMIN: 'Grupos em que sou admin',
        MEMBER: 'Grupos em que sou membro',
        OTHER: 'Outros grupos'
    };

    const shortLabels = {
        OWNER: 'Dono',
        ADMIN: 'Admin',
        MEMBER: 'Membro',
        OTHER: 'Outro'
    };

    return {
        title: labels[role] || role,
        badge: shortLabels[role] || role
    };
}

function renderMyGroupsRoleSection(role, groups, grupoAtual) {
    const section = document.createElement('section');
    section.className = 'groups-role-section';

    const roleMeta = getRoleMeta(role === 'OTHER' ? 'MEMBER' : role);
    const roleLabel = getRoleSectionLabel(role);

    section.innerHTML = `
        <header class="groups-role-header">
            <div class="groups-role-title-wrap">
                <h3>${roleLabel.title}</h3>
                <span class="group-badge ${roleMeta.css}">
                    <i class="${roleMeta.icon}"></i>
                    ${roleLabel.badge}
                </span>
            </div>
            <span class="groups-role-count">${groups.length}</span>
        </header>
    `;

    const grid = document.createElement('div');
    grid.className = 'groups-grid groups-role-grid';
    groups.forEach(group => grid.appendChild(renderMeuGrupoCard(group, grupoAtual)));
    section.appendChild(grid);

    return section;
}

function createEmptyState(textoPrincipal, textoSecundario = '') {
    const empty = document.createElement('div');
    empty.className = 'groups-empty-state';
    empty.innerHTML = `
        <strong>${textoPrincipal}</strong>
        <span>${textoSecundario}</span>
    `;

    return empty;
}

function formatarDataHora(dataStr) {
    if (!dataStr) return 'Sem expiracao';
    return new Date(dataStr).toLocaleString('pt-BR');
}

async function definirGrupoPadrao(group) {
    await groupService.definirGrupoPadrao(group.id);
    setFlashMessage(`Grupo "${group.name}" definido como grupo atual.`, 'SUCCESS');
    window.location.reload();
}

function appendMeta(container, titulo, valor) {
    const item = document.createElement('div');
    item.className = 'group-meta-item';
    item.innerHTML = `
        <span>${titulo}</span>
        <strong>${valor}</strong>
    `;
    container.appendChild(item);
}

function renderMeuGrupoCard(group, grupoAtual) {
    const card = document.createElement('article');
    const isSelected = Boolean(group.membership?.selected) || grupoAtual?.id === group.id;
    const isBanned = group.active === false;
    const isOwner = group.membership?.role === 'OWNER';
    const roleMeta = getRoleMeta(group.membership?.role);

    card.className = `group-card ${isBanned ? 'is-disabled' : ''} group-card-clickable`;
    card.innerHTML = `
        <button type="button" class="group-star-button ${isSelected ? 'is-selected' : ''}" ${isBanned ? 'disabled' : ''} aria-label="${isSelected ? 'Grupo selecionado' : 'Selecionar grupo'}">
            <i class="fa-${isSelected ? 'solid' : 'regular'} fa-star"></i>
        </button>
        <div class="group-card-header">
            <span class="group-card-tag">#${group.tag}</span>
            <h3>${group.name}</h3>
        </div>
        <div class="group-badges"></div>
        <div class="group-meta"></div>
        <div class="group-card-footer"></div>
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            window.location.href = `./detalhes-grupo.html?id=${group.id}`;
        }
    });

    const badges = card.querySelector('.group-badges');
    const meta = card.querySelector('.group-meta');
    const footer = card.querySelector('.group-card-footer');
    const starButton = card.querySelector('.group-star-button');

    badges.innerHTML = `
        <span class="group-badge ${roleMeta.css}">
            <i class="${roleMeta.icon}"></i>
            ${roleMeta.label}
        </span>
        ${isSelected ? `
            <span class="group-badge is-selected">
                <i class="fa-solid fa-star"></i>
                Grupo atual
            </span>
        ` : ''}
        ${isBanned ? `
            <span class="group-badge is-banned">
                <i class="fa-solid fa-ban"></i>
                Banido
            </span>
        ` : ''}
    `;

    appendMeta(meta, 'Membros', group.totalMembers ?? '—');
    appendMeta(meta, 'Política', getJoinPolicyLabel(group.joinPolicy));
    appendMeta(meta, 'Visibilidade', getVisibilityLabel(group.visibility));
    appendMeta(meta, 'Dono', group.owner?.name || '—');

    const mainAction = document.createElement('button');
    mainAction.type = 'button';
    mainAction.className = `group-btn-primary ${isSelected ? 'is-success' : ''}`;

    if (isBanned) {
        mainAction.textContent = 'Grupo indisponível';
        mainAction.disabled = true;
        mainAction.classList.add('group-btn-disabled');
    } else if (isSelected) {
        mainAction.textContent = 'Acessar grupo';
        mainAction.addEventListener('click', () => {
            window.location.href = './catalogo.html';
        });
    } else {
        mainAction.textContent = 'Selecionar e acessar';
        mainAction.addEventListener('click', async () => {
            try {
                await groupService.definirGrupoPadrao(group.id);
                setFlashMessage(`Grupo "${group.name}" definido como grupo atual.`, 'SUCCESS');
                window.location.href = './catalogo.html';
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || 'Não foi possível selecionar o grupo.', MensagemTipo.ERROR);
                } else {
                    criarMensagem('Erro de conexão ao selecionar o grupo.', MensagemTipo.ERROR);
                }
            }
        });
    }

    const secondaryAction = document.createElement('button');
    secondaryAction.type = 'button';
    secondaryAction.className = 'group-btn-secondary group-btn-danger';
    secondaryAction.textContent = 'Sair do grupo';
    secondaryAction.disabled = isOwner || isBanned;

    if (!secondaryAction.disabled) {
        secondaryAction.addEventListener('click', async () => {
            const confirmarSaida = confirm(`Tem certeza que deseja sair do grupo "${group.name}"?`);
            if (!confirmarSaida) return;

            try {
                await groupService.sairDoGrupo(group.id);
                setFlashMessage(`Você saiu do grupo "${group.name}".`, 'INFO');
                window.location.reload();
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || 'Não foi possível sair do grupo.', MensagemTipo.ERROR);
                } else {
                    criarMensagem('Erro de conexão ao sair do grupo.', MensagemTipo.ERROR);
                }
            }
        });
    }

    footer.append(mainAction, secondaryAction);

    if (!isSelected && !isBanned) {
        starButton.addEventListener('click', async () => {
            try {
                await definirGrupoPadrao(group);
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || 'Não foi possível alterar o grupo atual.', MensagemTipo.ERROR);
                } else {
                    criarMensagem('Erro de conexão ao alterar o grupo atual.', MensagemTipo.ERROR);
                }
            }
        });
    }

    return card;
}

function renderPublicGroupCard(group) {
    const card = document.createElement('article');
    card.className = 'group-card';

    const hasPendingRequest = group.pendingJoinRequest?.status === 'PENDING';

    card.innerHTML = `
        <div class="group-card-header">
            <span class="group-card-tag">#${group.tag}</span>
            <h3>${group.name}</h3>
        </div>
        <div class="group-badges">
            <span class="group-badge role-member">
                <i class="fa-solid fa-door-open"></i>
                ${getJoinPolicyLabel(group.joinPolicy)}
            </span>
            ${hasPendingRequest ? `
                <span class="group-badge is-selected">
                    <i class="fa-regular fa-clock"></i>
                    Solicitação pendente
                </span>
            ` : ''}
        </div>
        <div class="group-meta"></div>
        <div class="group-card-footer"></div>
    `;


    const meta = card.querySelector('.group-meta');
    const footer = card.querySelector('.group-card-footer');

    appendMeta(meta, 'Visibilidade', getVisibilityLabel(group.visibility));
    appendMeta(meta, 'Política', getJoinPolicyLabel(group.joinPolicy));
    appendMeta(meta, 'Dono', group.owner?.name || '—');
    appendMeta(meta, 'Status', group.active === false ? 'Indisponível' : 'Disponível');
    appendMeta(meta, 'Membros', group.totalMembers ?? 0);

    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'group-btn-primary';

    if (group.joinPolicy === 'OPEN') {
        action.textContent = 'Entrar';
        action.addEventListener('click', async () => {
            try {
                await groupService.entrarNoGrupo(group.id);
                await groupService.definirGrupoPadrao(group.id);
                setFlashMessage(`Você entrou no grupo "${group.name}" com sucesso.`, 'SUCCESS');
                window.location.href = `./detalhes-grupo.html?id=${group.id}`;
            } catch (err) {
                if (err instanceof ApiError) {
                    criarMensagem(err.detail || 'Não foi possível entrar no grupo.', MensagemTipo.ERROR);
                } else {
                    criarMensagem('Erro de conexão ao entrar no grupo.', MensagemTipo.ERROR);
                }
            }
        });
    } else if (group.joinPolicy === 'REQUEST') {
        if (hasPendingRequest) {
            action.textContent = 'Cancelar solicitação';
            action.className = 'group-btn-secondary group-btn-warning';
            action.addEventListener('click', async () => {
                const confirmarCancelamento = confirm(`Deseja cancelar sua solicitação para o grupo "${group.name}"?`);
                if (!confirmarCancelamento) return;

                try {
                    await groupService.cancelarMinhaSolicitacaoEntrada(group.id);
                    setFlashMessage(`Solicitação cancelada para o grupo "${group.name}".`, 'INFO');
                    window.location.reload();
                } catch (err) {
                    if (err instanceof ApiError) {
                        criarMensagem(err.detail || 'Não foi possível cancelar a solicitação.', MensagemTipo.ERROR);
                    } else {
                        criarMensagem('Erro de conexão ao cancelar a solicitação.', MensagemTipo.ERROR);
                    }
                }
            });
        } else {
            action.textContent = 'Solicitar entrada';
            action.addEventListener('click', async () => {
                try {
                    await groupService.solicitarEntradaNoGrupo(group.id);
                    setFlashMessage(`Solicitação enviada para o grupo "${group.name}".`, 'INFO');
                    window.location.reload();
                } catch (err) {
                    if (err instanceof ApiError) {
                        criarMensagem(err.detail || 'Não foi possível solicitar entrada.', MensagemTipo.ERROR);
                    } else {
                        criarMensagem('Erro de conexão ao solicitar entrada no grupo.', MensagemTipo.ERROR);
                    }
                }
            });
        }
    } else {
        action.textContent = 'Somente convite';
        action.disabled = true;
        action.classList.add('group-btn-disabled');
    }

    footer.appendChild(action);

    return card;
}

function renderInviteReceivedCard(invite) {
    const card = document.createElement('article');
    card.className = 'group-card';

    const groupName = invite.groupName || `Grupo #${invite.groupId}`;
    const groupTag = invite.groupTag || 'convite';
    const expiraEm = formatarDataHora(invite.expiresAt);

    card.innerHTML = `
        <div class="group-card-header">
            <span class="group-card-tag">#${groupTag}</span>
            <h3>${groupName}</h3>
        </div>
        <div class="group-badges">
            <span class="group-badge role-member">
                <i class="fa-solid fa-envelope"></i>
                Convite direto
            </span>
        </div>
        <div class="group-meta"></div>
        <div class="group-card-footer"></div>
    `;

    const meta = card.querySelector('.group-meta');
    const footer = card.querySelector('.group-card-footer');

    appendMeta(meta, 'Expira em', expiraEm);

    const aceitar = document.createElement('button');
    aceitar.type = 'button';
    aceitar.className = 'group-btn-primary';
    aceitar.textContent = 'Aceitar convite';
    aceitar.addEventListener('click', async () => {
        try {
            await groupService.aceitarConvite(invite.token);
            await groupService.definirGrupoPadrao(invite.groupId);
            setFlashMessage(`Voce entrou no grupo "${groupName}".`, 'SUCCESS');
            window.location.href = `./detalhes-grupo.html?id=${invite.groupId}`;
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || 'Nao foi possivel aceitar o convite.', MensagemTipo.ERROR);
            } else {
                criarMensagem('Erro de conexao ao aceitar o convite.', MensagemTipo.ERROR);
            }
        }
    });

    const recusar = document.createElement('button');
    recusar.type = 'button';
    recusar.className = 'group-btn-secondary group-btn-warning';
    recusar.textContent = 'Recusar convite';
    recusar.addEventListener('click', async () => {
        const confirmarRecusa = confirm(`Deseja recusar o convite para o grupo "${groupName}"?`);
        if (!confirmarRecusa) return;

        try {
            await groupService.recusarConvite(invite.id);
            criarMensagem(`Convite para "${groupName}" recusado.`, MensagemTipo.INFO);
            window.location.reload();
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || 'Nao foi possivel recusar o convite.', MensagemTipo.ERROR);
            } else {
                criarMensagem('Erro de conexao ao recusar o convite.', MensagemTipo.ERROR);
            }
        }
    });

    footer.append(aceitar, recusar);
    return card;
}

function renderMeusGrupos(groups, grupoAtual) {
    const container = document.getElementById('meus-grupos-lista');
    if (!container) return;

    container.innerHTML = '';

    if (!groups.length) {
        container.appendChild(createEmptyState(
            'Você ainda não participa de nenhum grupo.',
            'Veja abaixo os grupos públicos disponíveis para entrar ou solicitar participação.'
        ));
        return;
    }

    const groupsByRole = groupMyGroupsByRole(groups);
    const roleOrder = ['OWNER', 'ADMIN', 'MEMBER', 'OTHER'];

    roleOrder.forEach(role => {
        const groupsInRole = groupsByRole[role] || [];
        if (!groupsInRole.length) return;

        container.appendChild(renderMyGroupsRoleSection(role, groupsInRole, grupoAtual));
    });
}

function renderGruposPublicos(groups) {
    const container = document.getElementById('grupos-publicos-lista');
    if (!container) return;

    container.innerHTML = '';

    if (!groups.length) {
        container.appendChild(createEmptyState(
            'Nenhum grupo público disponível no momento.',
            'Quando novos grupos públicos forem criados, eles aparecerão aqui.'
        ));
        return;
    }

    groups.forEach(group => container.appendChild(renderPublicGroupCard(group)));
}

function renderConvitesRecebidos(invites) {
    const container = document.getElementById('convites-recebidos-lista');
    if (!container) return;

    container.innerHTML = '';

    if (!invites.length) {
        container.appendChild(createEmptyState(
            'Nenhum convite recebido no momento.',
            'Quando alguem enviar um convite direto para voce, ele aparecera aqui.'
        ));
        return;
    }

    invites.forEach(invite => container.appendChild(renderInviteReceivedCard(invite)));
}

function atualizarBadgeConvites(total) {
    const badge = document.getElementById('convites-tab-badge');
    if (!badge) return;

    const count = Number(total) || 0;
    badge.textContent = String(count);
    badge.classList.toggle('inativo', count <= 0);
}

function setFieldState(input, helper, { valid, message, checking = false }) {
    const isChecking = checking === true;

    if (input) {
        input.classList.toggle('is-valid', valid === true && !isChecking);
        input.classList.toggle('is-error', valid === false);
        input.classList.toggle('is-checking', isChecking);
    }

    if (helper) {
        helper.textContent = message;
        helper.classList.toggle('is-valid', valid === true && !isChecking);
        helper.classList.toggle('is-error', valid === false);
        helper.classList.toggle('is-checking', isChecking);
    }
}

function atualizarContadorCaracteres(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;

    const currentLength = input.value?.trim()?.length || 0;
    counter.textContent = `${currentLength}/${maxLength}`;
    counter.classList.toggle('is-near-limit', currentLength >= Math.max(maxLength - 2, 1) && currentLength < maxLength);
    counter.classList.toggle('is-at-limit', currentLength >= maxLength);
}

function atualizarContadoresCriacaoGrupo() {
    atualizarContadorCaracteres('grupo-tag', 'grupo-tag-counter', CREATE_GROUP_LIMITS.tag);
    atualizarContadorCaracteres('grupo-slug', 'grupo-slug-counter', CREATE_GROUP_LIMITS.slug);
}

function limparEstadoDisponibilidadeCampo(field, value = '') {
    createGroupState.availability[field] = createEmptyAvailabilityState(value);
}

function atualizarEstadoDisponibilidadeCampo(field, nextState) {
    createGroupState.availability[field] = {
        ...createEmptyAvailabilityState(),
        ...createGroupState.availability[field],
        ...nextState
    };
}

function obterEstadoDisponibilidadeAtual(field, currentValue) {
    const availabilityState = createGroupState.availability[field];
    if (availabilityState.value !== currentValue) {
        return createEmptyAvailabilityState(currentValue);
    }

    return availabilityState;
}

function resetarEstadoDisponibilidadeCriacaoGrupo() {
    if (createGroupState.debounceId) {
        clearTimeout(createGroupState.debounceId);
        createGroupState.debounceId = null;
    }

    createGroupState.requestId = 0;
    limparEstadoDisponibilidadeCampo('tag');
    limparEstadoDisponibilidadeCampo('slug');
}

function campoTagValido(tag) {
    return CREATE_GROUP_PATTERNS.tag.test(tag);
}

function campoSlugValido(slug) {
    return CREATE_GROUP_PATTERNS.slug.test(slug)
        && slug.length >= 4
        && slug.length <= CREATE_GROUP_LIMITS.slug;
}

async function validarDisponibilidadeGrupoAgora() {
    const tag = document.getElementById('grupo-tag')?.value?.trim() || '';
    const slug = document.getElementById('grupo-slug')?.value?.trim() || '';
    const tagValido = campoTagValido(tag);
    const slugValido = campoSlugValido(slug);

    if (!tagValido && !slugValido) {
        validarFormularioCriacaoGrupo(true);
        return { tagAvailable: false, slugAvailable: false };
    }

    if (tagValido) {
        atualizarEstadoDisponibilidadeCampo('tag', { value: tag, checking: true, error: false, available: null });
    }

    if (slugValido) {
        atualizarEstadoDisponibilidadeCampo('slug', { value: slug, checking: true, error: false, available: null });
    }

    validarFormularioCriacaoGrupo(true);

    try {
        const response = await groupService.buscarDisponibilidadeGrupo({
            tag: tagValido ? tag : null,
            slug: slugValido ? slug : null
        });

        if (tagValido) {
            atualizarEstadoDisponibilidadeCampo('tag', {
                value: response?.tag?.value || tag,
                available: response?.tag?.available === true,
                checking: false,
                error: false
            });
        }

        if (slugValido) {
            atualizarEstadoDisponibilidadeCampo('slug', {
                value: response?.slug?.value || slug,
                available: response?.slug?.available === true,
                checking: false,
                error: false
            });
        }

        validarFormularioCriacaoGrupo(true);
        return {
            tagAvailable: !tagValido || response?.tag?.available === true,
            slugAvailable: !slugValido || response?.slug?.available === true
        };
    } catch (err) {
        if (tagValido) {
            atualizarEstadoDisponibilidadeCampo('tag', { value: tag, available: null, checking: false, error: true });
        }

        if (slugValido) {
            atualizarEstadoDisponibilidadeCampo('slug', { value: slug, available: null, checking: false, error: true });
        }

        validarFormularioCriacaoGrupo(true);
        throw err;
    }
}

function agendarValidacaoDisponibilidadeGrupo() {
    if (createGroupState.debounceId) {
        clearTimeout(createGroupState.debounceId);
        createGroupState.debounceId = null;
    }

    const tag = document.getElementById('grupo-tag')?.value?.trim() || '';
    const slug = document.getElementById('grupo-slug')?.value?.trim() || '';
    const tagValido = campoTagValido(tag);
    const slugValido = campoSlugValido(slug);

    if (!tagValido) {
        limparEstadoDisponibilidadeCampo('tag', tag);
    }

    if (!slugValido) {
        limparEstadoDisponibilidadeCampo('slug', slug);
    }

    const tagState = obterEstadoDisponibilidadeAtual('tag', tag);
    const slugState = obterEstadoDisponibilidadeAtual('slug', slug);

    const shouldCheckTag = tagValido && !tagState.checking && (tagState.available === null || tagState.error);
    const shouldCheckSlug = slugValido && !slugState.checking && (slugState.available === null || slugState.error);

    validarFormularioCriacaoGrupo();

    if (!shouldCheckTag && !shouldCheckSlug) {
        return;
    }

    if (shouldCheckTag) {
        atualizarEstadoDisponibilidadeCampo('tag', { value: tag, checking: true, error: false, available: null });
    }

    if (shouldCheckSlug) {
        atualizarEstadoDisponibilidadeCampo('slug', { value: slug, checking: true, error: false, available: null });
    }

    validarFormularioCriacaoGrupo();

    const requestId = ++createGroupState.requestId;
    createGroupState.debounceId = window.setTimeout(async () => {
        try {
            const response = await groupService.buscarDisponibilidadeGrupo({
                tag: shouldCheckTag ? tag : null,
                slug: shouldCheckSlug ? slug : null
            });

            if (requestId !== createGroupState.requestId) {
                return;
            }

            const currentTag = document.getElementById('grupo-tag')?.value?.trim() || '';
            const currentSlug = document.getElementById('grupo-slug')?.value?.trim() || '';

            if (shouldCheckTag && currentTag === tag) {
                atualizarEstadoDisponibilidadeCampo('tag', {
                    value: response?.tag?.value || tag,
                    available: response?.tag?.available === true,
                    checking: false,
                    error: false
                });
            }

            if (shouldCheckSlug && currentSlug === slug) {
                atualizarEstadoDisponibilidadeCampo('slug', {
                    value: response?.slug?.value || slug,
                    available: response?.slug?.available === true,
                    checking: false,
                    error: false
                });
            }
        } catch (_) {
            if (requestId !== createGroupState.requestId) {
                return;
            }

            const currentTag = document.getElementById('grupo-tag')?.value?.trim() || '';
            const currentSlug = document.getElementById('grupo-slug')?.value?.trim() || '';

            if (shouldCheckTag && currentTag === tag) {
                atualizarEstadoDisponibilidadeCampo('tag', { value: tag, available: null, checking: false, error: true });
            }

            if (shouldCheckSlug && currentSlug === slug) {
                atualizarEstadoDisponibilidadeCampo('slug', { value: slug, available: null, checking: false, error: true });
            }
        } finally {
            if (requestId === createGroupState.requestId) {
                validarFormularioCriacaoGrupo();
            }
        }
    }, 320);
}

function atualizarPreviewCriacaoGrupo() {
    const name = document.getElementById('grupo-name')?.value?.trim();
    const tag = document.getElementById('grupo-tag')?.value?.trim();
    const slug = document.getElementById('grupo-slug')?.value?.trim();
    const visibility = document.getElementById('grupo-visibility')?.value || 'PUBLIC';
    const joinPolicy = document.getElementById('grupo-join-policy')?.value || 'OPEN';

    renderGroupPreviewCard(document.getElementById('create-group-preview-card'), {
        name,
        tag,
        slug,
        visibility,
        joinPolicy,
        ownerName: 'Você',
        membersCount: 1,
        accentLabel: 'Grupo novo',
        accentIcon: 'fa-solid fa-sparkles',
        primaryActionLabel: 'Acessar grupo',
        secondaryActionLabel: 'Configurar depois'
    });
}

function validarFormularioCriacaoGrupo(forceFeedback = false) {
    const nameInput = document.getElementById('grupo-name');
    const tagInput = document.getElementById('grupo-tag');
    const slugInput = document.getElementById('grupo-slug');
    const submitButton = document.getElementById('btn-salvar-criar-grupo');

    const nameHelper = document.getElementById('grupo-name-helper');
    const tagHelper = document.getElementById('grupo-tag-helper');
    const slugHelper = document.getElementById('grupo-slug-helper');

    const name = nameInput?.value?.trim() || '';
    const tag = tagInput?.value?.trim() || '';
    const slug = slugInput?.value?.trim() || '';

    const nameValid = name.length >= 3;
    const tagValid = campoTagValido(tag);
    const slugValid = campoSlugValido(slug);

    const tagAvailability = obterEstadoDisponibilidadeAtual('tag', tag);
    const slugAvailability = obterEstadoDisponibilidadeAtual('slug', slug);

    const nameTouched = forceFeedback || Boolean(nameInput?.dataset.touched);
    const tagTouched = forceFeedback || Boolean(tagInput?.dataset.touched);
    const slugTouched = forceFeedback || Boolean(slugInput?.dataset.touched);

    setFieldState(nameInput, nameHelper, {
        valid: nameTouched ? nameValid : null,
        message: nameTouched
            ? (nameValid ? 'Nome válido.' : 'Use pelo menos 3 caracteres.')
            : 'Informe um nome claro para o grupo.'
    });

    setFieldState(tagInput, tagHelper, {
        valid: tagTouched
            ? (tagValid ? (tagAvailability.available === true ? true : (tagAvailability.available === false || tagAvailability.error ? false : null)) : false)
            : null,
        checking: tagTouched && tagValid && tagAvailability.checking,
        message: !tagTouched
            ? 'Use de 4 a 6 caracteres alfanuméricos ou _.'
            : !tagValid
                ? 'Use de 4 a 6 caracteres alfanuméricos ou _ em maiúsculo.'
                : tagAvailability.checking
                    ? 'Verificando disponibilidade real da tag...'
                    : tagAvailability.error
                        ? 'Não foi possível validar a tag agora. Tente novamente.'
                        : tagAvailability.available === false
                            ? 'Esta tag já está em uso por outro grupo.'
                            : tagAvailability.available === true
                                ? 'Tag disponível.'
                                : 'A tag será validada automaticamente.'
    });

    setFieldState(slugInput, slugHelper, {
        valid: slugTouched
            ? (slugValid ? (slugAvailability.available === true ? true : (slugAvailability.available === false || slugAvailability.error ? false : null)) : false)
            : null,
        checking: slugTouched && slugValid && slugAvailability.checking,
        message: !slugTouched
            ? 'Use 4 a 30 caracteres minúsculos, números e hífen.'
            : !slugValid
                ? 'Use 4 a 30 caracteres minúsculos, números e hífen sem espaços.'
                : slugAvailability.checking
                    ? 'Verificando disponibilidade real do slug...'
                    : slugAvailability.error
                        ? 'Não foi possível validar o slug agora. Tente novamente.'
                        : slugAvailability.available === false
                            ? 'Este slug já está em uso por outro grupo.'
                            : slugAvailability.available === true
                                ? 'Slug disponível.'
                                : 'O slug será validado automaticamente.'
    });

    const isValid = nameValid
        && tagValid
        && slugValid
        && tagAvailability.available === true
        && slugAvailability.available === true
        && !tagAvailability.checking
        && !slugAvailability.checking
        && !tagAvailability.error
        && !slugAvailability.error;
    if (submitButton) submitButton.disabled = !isValid;

    atualizarContadoresCriacaoGrupo();
    atualizarPreviewCriacaoGrupo();
    return isValid;
}

function ativarTab(tabName) {
    const tabs = document.querySelectorAll('.groups-tab');
    const panels = document.querySelectorAll('.groups-tab-content');

    tabs.forEach(item => {
        const isActive = item.dataset.tab === tabName;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
    });

    panels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
}

function configurarTabs(initialTab = 'grupos') {
    const tabs = document.querySelectorAll('.groups-tab');
    const panels = document.querySelectorAll('.groups-tab-content');
    if (!tabs.length || !panels.length) return;

    ativarTab(initialTab);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            ativarTab(tab.dataset.tab);
        });
    });
}

function configurarEntradaPorToken() {
    const form = document.getElementById('form-entrar-token');
    const input = document.getElementById('token-convite-input');

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = input?.value?.trim();
        if (!token) {
            criarMensagem('Informe um token de convite válido.', MensagemTipo.ALERT);
            return;
        }

        try {
            await groupService.aceitarConvite(token);
            const grupoAtual = await loadCurrentGroup();

            if (grupoAtual?.id) {
                setFlashMessage(`Você entrou no grupo "${grupoAtual.name}".`, 'SUCCESS');
                window.location.href = `./detalhes-grupo.html?id=${grupoAtual.id}`;
                return;
            }

            setFlashMessage('Convite aceito com sucesso.', 'SUCCESS');
            window.location.reload();
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || 'Não foi possível entrar com este token.', MensagemTipo.ERROR);
            } else {
                criarMensagem('Erro de conexão ao validar token.', MensagemTipo.ERROR);
            }
        }
    });
}

function abrirModal(modal) {
    if (!modal) return;

    if (createGroupState.closeTimerId) {
        clearTimeout(createGroupState.closeTimerId);
        createGroupState.closeTimerId = null;
    }

    modal.classList.remove('inativo', 'fechando');
    window.requestAnimationFrame(() => {
        modal.classList.add('ativo');
    });
}

function fecharModal(modal) {
    if (!modal) return;

    if (createGroupState.closeTimerId) {
        clearTimeout(createGroupState.closeTimerId);
    }

    modal.classList.remove('ativo');
    modal.classList.add('fechando');

    createGroupState.closeTimerId = window.setTimeout(() => {
        modal.classList.remove('fechando');
        modal.classList.add('inativo');
    }, 240);
}

function configurarCriacaoGrupo() {
    const modal = document.getElementById('modal-criar-grupo');
    const openButton = document.getElementById('btn-abrir-criar-grupo');
    const closeButton = document.getElementById('fechar-modal-criar-grupo');
    const cancelButton = document.getElementById('btn-cancelar-criar-grupo');
    const form = document.getElementById('form-criar-grupo');
    const nameInput = document.getElementById('grupo-name');
    const tagInput = document.getElementById('grupo-tag');
    const slugInput = document.getElementById('grupo-slug');
    const visibilityInput = document.getElementById('grupo-visibility');
    const joinPolicyInput = document.getElementById('grupo-join-policy');

    function resetarFormularioCriacaoGrupo() {
        if (form) form.reset();
        if (nameInput) delete nameInput.dataset.touched;
        if (tagInput) delete tagInput.dataset.manuallyEdited;
        if (tagInput) delete tagInput.dataset.touched;
        if (slugInput) delete slugInput.dataset.manuallyEdited;
        if (slugInput) delete slugInput.dataset.touched;
        if (visibilityInput) visibilityInput.value = 'PUBLIC';
        if (joinPolicyInput) joinPolicyInput.value = 'OPEN';
        resetarEstadoDisponibilidadeCriacaoGrupo();
        atualizarContadoresCriacaoGrupo();
        atualizarPreviewCriacaoGrupo();
        validarFormularioCriacaoGrupo();
    }

    openButton?.addEventListener('click', () => {
        resetarFormularioCriacaoGrupo();
        abrirModal(modal);
    });
    closeButton?.addEventListener('click', () => fecharModal(modal));
    cancelButton?.addEventListener('click', () => fecharModal(modal));

    modal?.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModal(modal);
        }
    });

    nameInput?.addEventListener('input', () => {
        nameInput.dataset.touched = 'true';

        if (!slugInput?.dataset.manuallyEdited) {
            slugInput.value = slugifyGroupName(nameInput.value);
        }

        if (!tagInput?.dataset.manuallyEdited && (!tagInput.value || tagInput.value.length < 4)) {
            tagInput.value = gerarTagGrupo(nameInput.value);
        }

        validarFormularioCriacaoGrupo();
        agendarValidacaoDisponibilidadeGrupo();
    });

    tagInput?.addEventListener('input', () => {
        tagInput.dataset.touched = 'true';
        tagInput.dataset.manuallyEdited = 'true';
        tagInput.value = gerarTagGrupo(tagInput.value);
        validarFormularioCriacaoGrupo();
        agendarValidacaoDisponibilidadeGrupo();
    });

    slugInput?.addEventListener('input', () => {
        slugInput.dataset.touched = 'true';
        slugInput.dataset.manuallyEdited = 'true';
        slugInput.value = slugifyGroupName(slugInput.value);
        validarFormularioCriacaoGrupo();
        agendarValidacaoDisponibilidadeGrupo();
    });

    visibilityInput?.addEventListener('change', validarFormularioCriacaoGrupo);
    joinPolicyInput?.addEventListener('change', validarFormularioCriacaoGrupo);

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
            name: nameInput?.value?.trim(),
            tag: tagInput?.value?.trim(),
            slug: slugInput?.value?.trim(),
            visibility: document.getElementById('grupo-visibility')?.value || 'PUBLIC',
            joinPolicy: document.getElementById('grupo-join-policy')?.value || 'OPEN',
            onlyAdminAddMovie: false,
            allowGlobalVotes: false,
            voteChangeDeadlineDays: 0,
            movieNewDays: 0,
            inviteMaxUses: 0
        };

        if (!payload.name || !payload.tag || !payload.slug) {
            if (nameInput) nameInput.dataset.touched = 'true';
            if (tagInput) tagInput.dataset.touched = 'true';
            if (slugInput) slugInput.dataset.touched = 'true';
            validarFormularioCriacaoGrupo(true);
            criarMensagem('Preencha nome, tag e slug do grupo.', MensagemTipo.ALERT);
            return;
        }

        if (nameInput) nameInput.dataset.touched = 'true';
        if (tagInput) tagInput.dataset.touched = 'true';
        if (slugInput) slugInput.dataset.touched = 'true';

        if (!validarFormularioCriacaoGrupo(true)) {
            criarMensagem('Revise os campos destacados antes de criar o grupo.', MensagemTipo.ALERT);
            return;
        }

        try {
            const availability = await validarDisponibilidadeGrupoAgora();
            if (!availability.tagAvailable || !availability.slugAvailable) {
                criarMensagem('A tag ou o slug informados já estão em uso. Revise os campos destacados.', MensagemTipo.ALERT);
                return;
            }

            const createdGroup = await groupService.criarGrupo(payload);
            await groupService.definirGrupoPadrao(createdGroup.id);
            setFlashMessage(`Grupo "${createdGroup.name}" criado com sucesso.`, 'SUCCESS');
            fecharModal(modal);
            window.location.href = `./detalhes-grupo.html?id=${createdGroup.id}`;
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || 'Não foi possível criar o grupo.', MensagemTipo.ERROR);
            } else {
                criarMensagem('Erro de conexão ao validar ou criar o grupo.', MensagemTipo.ERROR);
            }
        }
    });

    atualizarContadoresCriacaoGrupo();
    atualizarPreviewCriacaoGrupo();
    validarFormularioCriacaoGrupo();
}

async function enriquecerGruposComSolicitacaoPendente(groups) {
    return await Promise.all(groups.map(async group => {
        if (group.joinPolicy !== 'REQUEST') {
            return { ...group, pendingJoinRequest: null };
        }

        try {
            const pendingJoinRequest = await groupService.buscarMinhaSolicitacaoEntrada(group.id);
            return { ...group, pendingJoinRequest };
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                return { ...group, pendingJoinRequest: null };
            }

            throw err;
        }
    }));
}

document.addEventListener('DOMContentLoaded', async () => {
    exibirFlashMessage();

    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    try {
        await authService.requireLogin();

        usuarioLogado = await authService.getUsuarioLogado();
        if (!usuarioLogado) {
            window.location.href = './login.html';
            return;
        }

        const [meusGruposResult, grupoAtualApiResult, gruposPublicosResult, convitesRecebidosResult] = await Promise.allSettled([
            groupService.buscarMeusGruposComMetadados(usuarioLogado.id),
            loadCurrentGroup(),
            groupService.buscarGruposPublicos(),
            groupService.buscarConvitesRecebidos()
        ]);

        const meusGrupos = meusGruposResult.status === 'fulfilled' ? meusGruposResult.value : [];
        const grupoAtualApi = grupoAtualApiResult.status === 'fulfilled' ? grupoAtualApiResult.value : null;
        const gruposPublicos = gruposPublicosResult.status === 'fulfilled' ? gruposPublicosResult.value : [];
        const convitesRecebidos = convitesRecebidosResult.status === 'fulfilled' ? convitesRecebidosResult.value : [];

        const grupoAtual = grupoAtualApi || getCurrentGroup() || meusGrupos.find(group => group.membership?.selected) || null;
        const meusGruposIds = new Set(meusGrupos.map(group => group.id));
        const gruposDisponiveis = gruposPublicos.filter(group => !meusGruposIds.has(group.id));
        const gruposDisponiveisComSolicitacao = await enriquecerGruposComSolicitacaoPendente(gruposDisponiveis);

        renderMeusGrupos(meusGrupos, grupoAtual);
        renderConvitesRecebidos(convitesRecebidos || []);
        renderGruposPublicos(gruposDisponiveisComSolicitacao);
        atualizarBadgeConvites((convitesRecebidos || []).length);
        configurarTabs((convitesRecebidos || []).length ? 'convites' : 'grupos');
        configurarEntradaPorToken();
        configurarCriacaoGrupo();
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || 'Erro ao carregar grupos.', MensagemTipo.ERROR);
        } else {
            criarMensagem('Erro de conexão com o servidor.', MensagemTipo.ERROR);
        }
    } finally {
        if (container) container.classList.remove('inativo-js');
        if (loader) loader.style.display = 'none';
    }
});

