import { authService } from '../../services/auth-service.js';
import { usuarioService } from '../../services/usuario-service.js';
import { votoService } from '../../services/voto-service.js';
import { adminService } from '../../services/admin-service.js';
import { formatarData, ordenarVotosPorDescricao, ordenarUsuariosPorNome } from '../../global.js';
import { abrirModalVoto } from './modal-cadastrar-voto.js';
import { abrirModalRedefinirSenha } from './modal-redefinir-senha.js';
import { abrirModalPermissoes } from './modal-permissoes.js';
import { abrirModalBanimento } from './modal-banimento.js';
import { ApiError } from '../../exception/api-error.js';
import { criarMensagem } from '../../components/mensagens.js';
import { MensagemTipo } from '../../components/mensagem-tipo.js';

const state = {
    currentUser: null,
    users: [],
    bots: [],
    groups: [],
    votes: [],
    groupsSearchTerm: '',
    groupsStatusFilter: 'ALL',
    expandedGroupIds: new Set()
};

function normalizarTextoBusca(value) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getGroupsFiltradosOrdenados() {
    const termo = normalizarTextoBusca(state.groupsSearchTerm);
    const statusFilter = state.groupsStatusFilter;

    const filtrados = !termo
        ? [...state.groups]
        : state.groups.filter(group => {
            const nome = normalizarTextoBusca(group.name);
            const tag = normalizarTextoBusca(group.tag);
            return nome.includes(termo) || tag.includes(termo);
        });

    const filtradosPorStatus = filtrados.filter(group => {
        if (statusFilter === 'BANNED') return group.banned === true;
        if (statusFilter === 'ACTIVE') return group.banned !== true;
        return true;
    });

    return filtradosPorStatus.sort((a, b) => {
        const banA = a.banned === true ? 1 : 0;
        const banB = b.banned === true ? 1 : 0;
        if (banA !== banB) return banB - banA;

        const nomeA = normalizarTextoBusca(a.name);
        const nomeB = normalizarTextoBusca(b.name);
        return nomeA.localeCompare(nomeB, 'pt-BR');
    });
}

function atualizarResumoAbas() {
    const gruposResumo = document.getElementById('grupos-resumo');
    const usuariosResumo = document.getElementById('usuarios-resumo');
    const votosResumo = document.getElementById('votos-resumo');
    const botsResumo = document.getElementById('bots-resumo');

    const gruposFiltrados = getGroupsFiltradosOrdenados();
    const filtroAplicado = state.groupsSearchTerm.trim() || state.groupsStatusFilter !== 'ALL';
    if (gruposResumo) {
        gruposResumo.textContent = filtroAplicado
            ? `${gruposFiltrados.length} de ${state.groups.length} grupos`
            : `${state.groups.length} grupos`;
    }
    if (usuariosResumo) usuariosResumo.textContent = `${state.users.length} usuários`;
    if (votosResumo) votosResumo.textContent = `${state.votes.length} votos globais`;
    if (botsResumo) botsResumo.textContent = `${state.bots.length} bots`;
}

function atualizarChipsFiltroGrupo() {
    const chips = document.querySelectorAll('.chip-filtro-grupo[data-group-filter]');
    chips.forEach(chip => {
        chip.classList.toggle('ativo', chip.dataset.groupFilter === state.groupsStatusFilter);
    });
}

function initGroupsQuickFilters() {
    const chips = document.querySelectorAll('.chip-filtro-grupo[data-group-filter]');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            state.groupsStatusFilter = chip.dataset.groupFilter || 'ALL';
            atualizarChipsFiltroGrupo();
            atualizarResumoAbas();
            renderGroups();
        });
    });

    atualizarChipsFiltroGrupo();
}

function initGroupsSearch() {
    const input = document.getElementById('grupos-busca');
    if (!input) return;

    input.addEventListener('input', () => {
        state.groupsSearchTerm = input.value || '';
        atualizarResumoAbas();
        renderGroups();
    });
}

function formatarDataOrDash(value) {
    return value ? formatarData(value) : '—';
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

function obterIniciais(texto) {
    if (!texto) return '--';
    const partes = texto.trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '--';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

async function handleGroupBanToggle(group) {
    const banned = group.banned === true;
    const payload = await abrirModalBanimento({
        mode: banned ? 'unban' : 'ban',
        targetType: 'group',
        targetLabel: 'grupo',
        name: group.name,
        identifier: `#${group.tag} • /${group.slug}`
    });

    if (!payload?.confirmed) return;

    try {
        if (banned) {
            await adminService.desbanirGrupo(group.id);
            criarMensagem(`Grupo "${group.name}" desbanido com sucesso.`, MensagemTipo.SUCCESS);
        } else {
            await adminService.banirGrupo(group.id, payload.reason, payload.expiresAt);
            criarMensagem(`Grupo "${group.name}" banido com sucesso.`, MensagemTipo.SUCCESS);
        }

        renderLoadingStates();
        await carregarDados();
        renderTudo();
    } catch (err) {
        handleUiError(err, 'Não foi possível atualizar o status do grupo.');
    }
}

function renderLoadingStates() {
    const grupos = document.getElementById('lista-grupos-admin');
    const usuarios = document.querySelector('#usuarios tbody');
    const bots = document.querySelector('#bots tbody');
    const votos = document.querySelector('.lista-votos');

    if (grupos) {
        grupos.innerHTML = '<div class="admin-empty">Carregando grupos...</div>';
    }

    if (usuarios) {
        usuarios.innerHTML = '<tr><td colspan="5">Carregando usuários...</td></tr>';
    }

    if (bots) {
        bots.innerHTML = '<tr><td colspan="5">Carregando bots...</td></tr>';
    }

    if (votos) {
        votos.innerHTML = '<div class="admin-empty">Carregando tipos de voto...</div>';
    }
}

function initTabs() {
    const buttons = document.querySelectorAll('.btn-menu[data-tab]');
    const panes = document.querySelectorAll('.tab-pane');

    const ativarTab = (tab) => {
        buttons.forEach(button => {
            const isActive = button.dataset.tab === tab;
            button.classList.toggle('ativo', isActive);
            button.setAttribute('aria-selected', String(isActive));
        });

        panes.forEach(pane => {
            pane.classList.toggle('ativo', pane.id === tab);
        });
    };

    const initialActiveButton = document.querySelector('.btn-menu.ativo[data-tab]');
    ativarTab(initialActiveButton?.dataset.tab || 'grupos');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            ativarTab(button.dataset.tab);
        });
    });
}

function atualizarKpis() {
    const totalGrupos = state.groups.length;
    const gruposBanidos = state.groups.filter(g => g.banned === true).length;
    const totalUsuarios = state.users.filter(u => !u.bot).length;
    const usuariosBanidos = state.users.filter(u => u.banned === true).length;
    const usuariosAdmin = state.users.filter(u => u.admin === true || u.isAdmin === true || u.superAdmin === true).length;
    const totalBots = state.bots.length;

    const gruposEl = document.getElementById('kpi-total-grupos');
    const gruposBanidosEl = document.getElementById('kpi-grupos-banidos');
    const usuariosEl = document.getElementById('kpi-total-usuarios');
    const usuariosBanidosEl = document.getElementById('kpi-usuarios-banidos');
    const usuariosAdminEl = document.getElementById('kpi-usuarios-admin');
    const botsEl = document.getElementById('kpi-total-bots');

    if (gruposEl) gruposEl.textContent = String(totalGrupos);
    if (gruposBanidosEl) gruposBanidosEl.textContent = String(gruposBanidos);
    if (usuariosEl) usuariosEl.textContent = String(totalUsuarios);
    if (usuariosBanidosEl) usuariosBanidosEl.textContent = String(usuariosBanidos);
    if (usuariosAdminEl) usuariosAdminEl.textContent = String(usuariosAdmin);
    if (botsEl) botsEl.textContent = String(totalBots);
}

function getStatusBadge(active, banned) {
    if (banned) return '<span class="badge badge-inativo"><i class="fa-solid fa-ban"></i> Banido</span>';
    if (!active) return '<span class="badge badge-inativo"><i class="fa-solid fa-circle-minus"></i> Inativo</span>';
    return '<span class="badge badge-ativo"><i class="fa-regular fa-circle-check"></i> Ativo</span>';
}

function renderGroups() {
    const container = document.getElementById('lista-grupos-admin');
    if (!container) return;

    container.innerHTML = '';

    if (!state.groups.length) {
        container.innerHTML = '<div class="admin-empty">Nenhum grupo encontrado.</div>';
        return;
    }

    const grupos = getGroupsFiltradosOrdenados();

    if (!grupos.length) {
        container.innerHTML = '<div class="admin-empty">Nenhum grupo corresponde ao filtro informado.</div>';
        return;
    }

    grupos.forEach(group => {
        const card = document.createElement('article');

        const banned = group.banned === true;
        const ownerName = group.owner?.name || 'Sem dono';
        const groupInitials = obterIniciais(group.name);
        const isExpanded = state.expandedGroupIds.has(group.id);
        const visibilityLabel = getVisibilityLabel(group.visibility);
        const joinPolicyLabel = getJoinPolicyLabel(group.joinPolicy);

        card.className = `grupo-admin-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}`;

        card.innerHTML = `
            <div class="grupo-admin-head grupo-admin-hero">
                <div class="grupo-admin-brand">
                    <div class="grupo-admin-avatar">${groupInitials}</div>
                    <div class="grupo-admin-title-wrap">
                        <div class="grupo-admin-title-row">
                            <h3>${group.name}</h3>
                            <div class="grupo-admin-badges">
                                ${getStatusBadge(group.active, banned)}
                            </div>
                        </div>
                        <div class="grupo-admin-identificadores">
                            <span class="grupo-admin-identificador-linha">#${group.tag} • /${group.slug}</span>
                        </div>
                        <div class="grupo-admin-owner-line">
                            <i class="fa-regular fa-user"></i>
                            <span>Dono do grupo: <strong>${ownerName}</strong></span>
                        </div>
                    </div>
                </div>
                <div class="grupo-admin-head-right grupo-admin-actions">
                    <button type="button" class="btn-acoes ${banned ? 'btn-permissoes' : 'btn-excluir'}" data-action="ban-toggle">
                        <i class="fa-solid ${banned ? 'fa-unlock' : 'fa-ban'}"></i>
                        ${banned ? 'Desbanir grupo' : 'Banir grupo'}
                    </button>
                </div>
            </div>

            <div class="grupo-admin-resumo grupo-admin-footer">
                <button type="button" class="btn-toggle-detalhes" data-action="toggle-details">
                    <i class="fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                    ${isExpanded ? 'Ocultar configurações avançadas' : 'Ver configurações avançadas'}
                </button>
            </div>

            <div class="grupo-admin-detalhes ${isExpanded ? '' : 'inativo'}">
                <div class="grupo-admin-grid">
                    <div class="grupo-admin-item"><span>Criado em</span><strong>${formatarDataOrDash(group.createdAt)}</strong></div>
                    <div class="grupo-admin-item"><span>Visibilidade</span><strong>${visibilityLabel}</strong></div>
                    <div class="grupo-admin-item"><span>Entrada</span><strong>${joinPolicyLabel}</strong></div>
                    <div class="grupo-admin-item"><span>Votos globais</span><strong>${group.allowGlobalVotes ? 'Permitidos' : 'Bloqueados'}</strong></div>
                    <div class="grupo-admin-item"><span>Troca de voto</span><strong>${group.voteChangeDeadlineDays} dia(s)</strong></div>
                    <div class="grupo-admin-item"><span>Janela de filme novo</span><strong>${group.movieNewDays} dia(s)</strong></div>
                    <div class="grupo-admin-item"><span>Somente admin adiciona</span><strong>${group.onlyAdminAddMovie ? 'Sim' : 'Não'}</strong></div>
                    <div class="grupo-admin-item"><span>Conta do grupo</span><strong>${group.active === false ? 'Inativa' : 'Ativa'}</strong></div>
                </div>

                ${banned && (group.banReason || group.expiresAt) ? `
                    <div class="grupo-admin-alerta-banimento">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <div>
                            ${group.banReason ? `<p><strong>Motivo:</strong> ${group.banReason}</p>` : ''}
                            ${group.expiresAt ? `<p><strong>Expira em:</strong> ${formatarDataOrDash(group.expiresAt)}</p>` : '<p><strong>Expiração:</strong> Sem expiração definida</p>'}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        const actionButton = card.querySelector('[data-action="ban-toggle"]');
        actionButton?.addEventListener('click', async () => handleGroupBanToggle(group));

        const toggleDetailsButton = card.querySelector('[data-action="toggle-details"]');
        toggleDetailsButton?.addEventListener('click', () => {
            if (state.expandedGroupIds.has(group.id)) {
                state.expandedGroupIds.delete(group.id);
            } else {
                state.expandedGroupIds.add(group.id);
            }
            renderGroups();
        });

        container.appendChild(card);
    });
}

async function handleUserBanToggle(user) {
    const payload = await abrirModalBanimento({
        mode: user.banned === true ? 'unban' : 'ban',
        targetType: 'user',
        targetLabel: 'usuário',
        name: user.name,
        identifier: user.email || `Discord ID: ${user.discordId}`,
        avatar: user.avatar || './assets/img/placeholder-avatar.png'
    });

    if (!payload?.confirmed) return;

    try {
        if (user.banned === true) {
            await adminService.desbanirUsuario(user.id);
            criarMensagem(`Usuário "${user.name}" desbanido com sucesso.`, MensagemTipo.SUCCESS);
        } else {
            await adminService.banirUsuario(user.id, payload.reason, payload.expiresAt);
            criarMensagem(`Usuário "${user.name}" banido com sucesso.`, MensagemTipo.SUCCESS);
        }

        renderLoadingStates();
        await carregarDados();
        renderTudo();
    } catch (err) {
        handleUiError(err, 'Não foi possível atualizar o status do usuário.');
    }
}

function buildUserRow(usuario, isBot = false) {
    const isGlobalSuperAdmin = usuario.superAdmin === true;
    const isSystemAdmin = usuario.admin === true || usuario.isAdmin === true || isGlobalSuperAdmin;
    const tr = document.createElement('tr');
    tr.className = 'admin-entity-row';
    tr.dataset.discordId = usuario.discordId;
    tr.dataset.userId = String(usuario.id);
    tr.dataset.isAdmin = String(isSystemAdmin);
    tr.dataset.isSuperAdmin = String(isGlobalSuperAdmin);
    tr.dataset.isAtivo = String(usuario.active);
    tr.dataset.isLogado = String(usuario.discordId === state.currentUser?.discordId);

    tr.innerHTML = `
        <td data-label="${isBot ? 'Bot' : 'Usuário'}" class="admin-entity-main-cell">
            <a href="./perfil.html?id=${usuario.discordId}" class="link-perfil admin-entity-link">
                <div class="${isBot ? 'bots-info' : 'usuarios-info'} admin-entity-summary">
                    <img src="${usuario.avatar || './assets/img/placeholder-avatar.png'}" alt="Avatar ${usuario.name}">
                    <div class="usuario-texto">
                        <div class="nome-badge">
                            <span class="nome">${usuario.name}</span>
                            ${usuario.discordId === state.currentUser?.discordId ? '<span class="badge badge-voce">Você</span>' : ''}
                            ${isBot ? '<span class="badge badge-bot"><i class="fa-solid fa-robot"></i> Bot</span>' : ''}
                            ${!isBot && isSystemAdmin ? '<span class="badge badge-admin"><i class="fa-solid fa-shield"></i> Admin</span>' : ''}
                        </div>
                        <div class="usuario-meta-secundaria">Discord ID: ${usuario.discordId}</div>
                        ${usuario.banned ? `<div class="banimento-info">Conta banida globalmente${usuario.active === false ? ' e inativa' : ''}.</div>` : ''}
                    </div>
                </div>
            </a>
        </td>
        <td data-label="Email" class="admin-table-cell">
            <div class="admin-table-data">
                <span>Contato</span>
                <strong>${usuario.email || '—'}</strong>
            </div>
        </td>
        <td data-label="Membro Desde" class="admin-table-cell">
            <div class="admin-table-data">
                <span>Membro desde</span>
                <strong>${formatarDataOrDash(usuario.joined)}</strong>
            </div>
        </td>
        <td data-label="Status" class="admin-table-cell admin-status-cell">
            <div class="admin-table-data">
                <span>Situação</span>
                ${getStatusBadge(usuario.active, usuario.banned === true)}
            </div>
        </td>
        <td data-label="Ações" class="admin-table-cell admin-actions-cell">
            <div class="admin-table-data admin-table-actions-block">
                <div class="${isBot ? 'acoes-bot' : 'acoes-usuario'}">
                <button type="button" class="btn-acoes btn-redefinir"><i class="fa-solid fa-key"></i> Redefinir Senha</button>
                ${isBot ? '' : '<button type="button" class="btn-acoes btn-permissoes"><i class="fa-solid fa-shield"></i> Permissões</button>'}
                <button type="button" class="btn-acoes ${usuario.banned ? 'btn-permissoes' : 'btn-excluir'} btn-ban-toggle">
                    <i class="fa-solid ${usuario.banned ? 'fa-unlock' : 'fa-ban'}"></i>
                    ${usuario.banned ? 'Desbanir' : 'Banir'}
                </button>
                </div>
            </div>
        </td>
    `;

    tr.querySelector('.btn-redefinir')?.addEventListener('click', () => {
        abrirModalRedefinirSenha({
            nome: usuario.name,
            email: usuario.email,
            avatar: usuario.avatar || './assets/img/placeholder-avatar.png',
            userId: usuario.id,
            discordId: usuario.discordId
        });
    });

    tr.querySelector('.btn-permissoes')?.addEventListener('click', () => {
        abrirModalPermissoes({
            nome: usuario.name,
            email: usuario.email,
            userId: usuario.id,
            discordId: usuario.discordId,
            avatar: usuario.avatar || './assets/img/placeholder-avatar.png',
            isAdmin: isSystemAdmin,
            superAdmin: isGlobalSuperAdmin,
            isAtivo: usuario.active,
            isLogado: usuario.discordId === state.currentUser?.discordId
        }, state.currentUser);
    });

    tr.querySelector('.btn-ban-toggle')?.addEventListener('click', () => handleUserBanToggle(usuario));
    return tr;
}

function renderUsuarios() {
    const tbody = document.querySelector('#usuarios tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!state.users.length) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
        return;
    }

    state.users.forEach(user => tbody.appendChild(buildUserRow(user, false)));
}

function renderBots() {
    const tbody = document.querySelector('#bots tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!state.bots.length) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhum bot encontrado.</td></tr>';
        return;
    }

    state.bots.forEach(bot => tbody.appendChild(buildUserRow(bot, true)));
}

export function renderVotos(votos) {
    const containerVotos = document.querySelector('.lista-votos');
    const btnCadastrar = document.querySelector('.btn-novo');
    if (!containerVotos) return;

    containerVotos.innerHTML = '';

    if (!votos?.length) {
        containerVotos.innerHTML = '<div class="admin-empty">Nenhum tipo de voto global cadastrado.</div>';
    }

    if (btnCadastrar) {
        btnCadastrar.onclick = () => abrirModalVoto(null, votos);
    }

    votos.forEach(voto => {
        const div = document.createElement('div');
        div.className = 'voto';
        div.innerHTML = `
            <div class="voto-topo">
                <div class="voto-conteudo">
                    <div class="emoji-voto voto-emoji-badge">${voto.emoji}</div>
                    <div class="detalhes-voto">
                        <div class="voto-titulo-linha">
                            <h3>${voto.name}</h3>
                            <span class="badge ${voto.active === false ? 'badge-inativo' : 'badge-ativo'}">${voto.active === false ? 'Inativo' : 'Ativo'}</span>
                        </div>
                        <p>${voto.description}</p>
                    </div>
                </div>
                <div class="voto-acoes">
                    <button type="button" class="btn-acoes btn-editar" title="Editar tipo de voto" aria-label="Editar tipo de voto">
                        <i class="fa-regular fa-pen-to-square"></i>
                        Editar
                    </button>
                    <button type="button" class="btn-acoes btn-excluir" title="Excluir tipo de voto" aria-label="Excluir tipo de voto">
                        <i class="fa-regular fa-trash-can"></i>
                        Excluir
                    </button>
                </div>
            </div>
            <div class="voto-meta-grid">
                <div class="voto-meta-card">
                    <span>Cor</span>
                    <strong class="voto-cor-valor">
                        <span class="voto-cor-dot" style="background:${voto.color}"></span>
                        ${voto.color}
                    </strong>
                </div>
                <div class="voto-meta-card">
                    <span>Escopo</span>
                    <strong>Global</strong>
                </div>
            </div>
        `;

        div.querySelector('.btn-editar')?.addEventListener('click', () => abrirModalVoto(voto, votos));
        div.querySelector('.btn-excluir')?.addEventListener('click', async () => {
            if (!confirm(`Deseja realmente excluir o voto "${voto.name}"?`)) return;

            try {
                await votoService.excluirTipoVoto(voto.id);
                criarMensagem(`Voto ${voto.description} excluído com sucesso!`, MensagemTipo.SUCCESS);
                state.votes = state.votes.filter(v => v.id !== voto.id);
                renderVotos(state.votes);
            } catch (err) {
                handleUiError(err, 'Erro ao excluir tipo de voto.');
            }
        });

        containerVotos.appendChild(div);
    });
}

async function carregarDados() {
    state.currentUser = await authService.getUsuarioLogado();

    const [usuarios, grupos, votos] = await Promise.all([
        usuarioService.buscarUsuarios(true),
        adminService.buscarGruposAdmin(),
        votoService.buscarTiposVotos()
    ]);

    const ordenados = ordenarUsuariosPorNome(usuarios || []);
    state.users = ordenados.filter(user => !user.bot);
    state.bots = ordenados.filter(user => user.bot);
    state.groups = grupos || [];
    const idsAtuais = new Set(state.groups.map(group => group.id));
    state.expandedGroupIds.forEach(groupId => {
        if (!idsAtuais.has(groupId)) {
            state.expandedGroupIds.delete(groupId);
        }
    });
    state.votes = ordenarVotosPorDescricao((votos || []).filter(vote => vote.global === true));
}

function renderTudo() {
    atualizarKpis();
    atualizarResumoAbas();
    renderGroups();
    renderUsuarios();
    renderBots();
    renderVotos(state.votes);
}

function handleUiError(err, fallbackMessage) {
    if (err instanceof ApiError) {
        criarMensagem(err.detail || fallbackMessage, MensagemTipo.ERROR);
        return;
    }

    criarMensagem(fallbackMessage, MensagemTipo.ERROR);
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    try {
        await authService.requireLogin();
        await authService.requireSuperAdmin();

        initTabs();
        initGroupsSearch();
        initGroupsQuickFilters();
        renderLoadingStates();
        await carregarDados();
        renderTudo();
    } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
            sessionStorage.setItem('flashMessage', JSON.stringify({
                texto: err.detail,
                tipo: 'ERROR'
            }));
            window.location.href = './index.html';
            return;
        }

        handleUiError(err, 'Erro ao carregar o painel administrativo.');
    } finally {
        if (container) container.classList.remove('inativo-js');
        if (loader) loader.style.display = 'none';
    }
});