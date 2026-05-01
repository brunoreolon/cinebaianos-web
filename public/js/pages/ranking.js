import { authService } from '../services/auth-service.js';
import { votoService } from '../services/voto-service.js';
import { groupService } from '../services/group-service.js';
import { getCurrentGroup, loadCurrentGroup } from '../services/group-context.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

const MAX_VISIBLE_ITEMS = 10;

const ROLE_LABELS = {
    OWNER: 'Dono',
    ADMIN: 'Admin',
    MEMBER: 'Membro'
};

const state = {
    usuarioLogado: null,
    grupos: [],
    groupId: null,
    voteTypes: [],
    selectedVoteTypeId: null,
    summaryStats: [],
    rankingStats: [],
    roleByUserId: new Map(),
    requestToken: 0
};

function getVoteTotal(stats, voteTypeId) {
    return Number(stats?.votes?.find(v => Number(v?.type?.id) === Number(voteTypeId))?.totalVotes || 0);
}

function sortRanking(stats, voteTypeId) {
    return [...stats].sort((a, b) => {
        const diff = getVoteTotal(b, voteTypeId) - getVoteTotal(a, voteTypeId);
        if (diff !== 0) return diff;
        return (a?.user?.name || '').localeCompare(b?.user?.name || '', 'pt-BR', { sensitivity: 'base' });
    });
}

function createPositionElement(position) {
    const container = document.createElement('div');
    container.className = 'posicao ranking-position';

    const content = document.createElement('span');
    if (position === 1) {
        container.classList.add('primeiro');
        content.textContent = '🥇';
    } else if (position === 2) {
        container.classList.add('segundo');
        content.textContent = '🥈';
    } else if (position === 3) {
        container.classList.add('terceiro');
        content.textContent = '🥉';
    } else {
        container.classList.add('sem-medalha');
        content.textContent = `#${position}`;
    }

    container.appendChild(content);
    return container;
}

function renderRankingCards() {
    const cards = document.querySelector('.cards');
    if (!cards) return;

    cards.innerHTML = '';

    const selectedVoteType = state.voteTypes.find(v => Number(v.id) === Number(state.selectedVoteTypeId));
    if (!selectedVoteType) {
        cards.innerHTML = '<p class="fonte-secundaria">Nenhum tipo de voto disponível para este grupo.</p>';
        return;
    }

    const sorted = sortRanking(state.rankingStats, selectedVoteType.id);
    const hasAnyVotes = sorted.some(item => getVoteTotal(item, selectedVoteType.id) > 0);

    if (!hasAnyVotes) {
        cards.innerHTML = '<p class="fonte-secundaria">Ainda não há votos recebidos para este filtro.</p>';
        return;
    }

    const visible = sorted.slice(0, MAX_VISIBLE_ITEMS);
    const loggedIndex = sorted.findIndex(item => Number(item?.user?.id) === Number(state.usuarioLogado?.id));
    const shouldAppendLogged = loggedIndex >= MAX_VISIBLE_ITEMS;

    if (shouldAppendLogged) {
        visible.push(sorted[loggedIndex]);
    }

    visible.forEach(item => {
        const rankPosition = sorted.findIndex(row => Number(row?.user?.id) === Number(item?.user?.id)) + 1;
        const isCurrentUser = Number(item?.user?.id) === Number(state.usuarioLogado?.id);
        const totalVotes = getVoteTotal(item, selectedVoteType.id);

        const card = document.createElement('article');
        card.className = `card-ranking${isCurrentUser ? ' voce' : ''}`;

        const header = document.createElement('div');
        header.className = 'parte-1';

        const avatarWrap = document.createElement('div');
        avatarWrap.className = 'usuario-avatar ranking-avatar';
        const avatar = document.createElement('img');
        avatar.src = item?.user?.avatar || './assets/img/placeholder-avatar.png';
        avatar.alt = `Avatar de ${item?.user?.name || 'usuário'}`;
        avatar.addEventListener('error', () => {
            avatar.src = './assets/img/placeholder-avatar.png';
        }, { once: true });
        avatarWrap.appendChild(avatar);

        const userInfo = document.createElement('div');
        userInfo.className = 'usuario-info ranking-info';
        const userNameLine = document.createElement('div');
        userNameLine.className = 'usuario';
        const userName = document.createElement('h3');
        userName.textContent = item?.user?.name || 'Usuário';
        userNameLine.appendChild(userName);
        if (isCurrentUser) {
            const badge = document.createElement('span');
            badge.className = 'badge-voce';
            badge.textContent = 'Você';
            userNameLine.appendChild(badge);
        }

        const role = state.roleByUserId.get(Number(item?.user?.id)) || 'MEMBER';
        const subtitle = document.createElement('p');
        subtitle.textContent = `Cargo no grupo: ${ROLE_LABELS[role] || 'Membro'}`;
        userInfo.append(userNameLine, subtitle);

        const totalInfo = document.createElement('div');
        totalInfo.className = 'info';
        const value = document.createElement('div');
        value.textContent = String(totalVotes);
        const description = document.createElement('p');
        description.className = 'fonte-secundaria';
        description.textContent = selectedVoteType.description || selectedVoteType.name || 'Votos';
        totalInfo.append(value, description);

        header.append(createPositionElement(rankPosition), avatarWrap, userInfo, totalInfo);

        const separator = document.createElement('div');
        separator.className = 'separador';

        const votesGrid = document.createElement('div');
        votesGrid.className = 'votos';
        state.voteTypes.forEach(voteType => {
            const voteItem = document.createElement('div');
            voteItem.className = 'voto';

            const voteInfo = document.createElement('div');
            voteInfo.className = 'voto-info';
            const emoji = document.createElement('i');
            emoji.textContent = voteType.emoji || '⭐';
            const amount = document.createElement('p');
            amount.textContent = String(getVoteTotal(item, voteType.id));
            voteInfo.append(emoji, amount);

            const voteLabel = document.createElement('p');
            voteLabel.textContent = voteType.description || voteType.name || 'Voto';
            voteItem.append(voteInfo, voteLabel);
            votesGrid.appendChild(voteItem);
        });

        card.append(header, separator, votesGrid);
        cards.appendChild(card);
    });
}

function renderSummary() {
    const container = document.getElementById('resumo-vencedores');
    if (!container) return;

    container.innerHTML = '';

    if (!state.voteTypes.length) return;

    const summary = document.createElement('div');
    summary.className = 'resumo-vencedores';

    state.voteTypes.forEach(voteType => {
        const sorted = sortRanking(state.summaryStats, voteType.id);
        const winner = sorted[0];
        const total = winner ? getVoteTotal(winner, voteType.id) : 0;

        const item = document.createElement('div');
        item.className = 'resumo-item';

        const emoji = document.createElement('i');
        emoji.textContent = voteType.emoji || '⭐';

        const text = document.createElement('span');
        text.textContent = total > 0 && winner
            ? `${winner?.user?.name || 'Usuário'} (${total} votos)`
            : 'Sem votos ainda';

        item.append(emoji, text);
        summary.appendChild(item);
    });

    container.appendChild(summary);
}

function renderVoteTypeFilter() {
    const container = document.getElementById('filtro-votos');
    if (!container) return;

    container.innerHTML = '';

    state.voteTypes.forEach(voteType => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `filtro${Number(voteType.id) === Number(state.selectedVoteTypeId) ? ' ativo' : ''}`;
        button.style.backgroundColor = voteType.color || '#9810FA';

        const emoji = document.createElement('i');
        emoji.textContent = voteType.emoji || '⭐';
        const text = document.createElement('span');
        text.textContent = voteType.description || voteType.name || 'Voto';
        button.append(emoji, text);

        button.addEventListener('click', async () => {
            if (Number(state.selectedVoteTypeId) === Number(voteType.id)) return;
            state.selectedVoteTypeId = Number(voteType.id);
            renderVoteTypeFilter();
            await loadRankingBySelectedVote();
        });

        container.appendChild(button);
    });
}

function renderGroupFilter() {
    const select = document.getElementById('filtro-grupo');
    if (!select) return;

    select.innerHTML = '';

    state.grupos.forEach(group => {
        const option = document.createElement('option');
        option.value = String(group.id);
        option.textContent = group.name || `Grupo #${group.id}`;
        option.selected = Number(group.id) === Number(state.groupId);
        select.appendChild(option);
    });

    if (select.dataset.bound === 'true') return;
    select.dataset.bound = 'true';
    select.addEventListener('change', async () => {
        await changeGroup(Number(select.value));
    });
}

async function loadRankingBySelectedVote() {
    try {
        const data = await votoService.buscarRankingVotosRecebidosGrupo(state.groupId, state.selectedVoteTypeId);
        state.rankingStats = Array.isArray(data) ? data : [];
    } catch (err) {
        state.rankingStats = [];
        if (err instanceof ApiError) {
            criarMensagem(err.detail || 'Não foi possível carregar o ranking para este filtro.', MensagemTipo.ERROR);
        } else {
            criarMensagem('Erro de conexão ao atualizar o ranking.', MensagemTipo.ERROR);
        }
    }

    renderRankingCards();
}

async function changeGroup(groupId) {
    state.groupId = Number(groupId);
    const requestToken = ++state.requestToken;

    const [membersResponse, voteTypesResponse, summaryResponse] = await Promise.all([
        groupService.buscarMembrosDoGrupo(state.groupId),
        votoService.buscarTiposVotosDisponiveis(state.groupId),
        votoService.buscarRankingVotosRecebidosGrupo(state.groupId)
    ]);

    if (requestToken !== state.requestToken) return;

    state.roleByUserId = new Map((membersResponse?.members || []).map(member => [
        Number(member?.member?.id),
        member?.role || 'MEMBER'
    ]));
    state.voteTypes = Array.isArray(voteTypesResponse) ? voteTypesResponse : [];
    state.summaryStats = Array.isArray(summaryResponse) ? summaryResponse : [];

    const hasSelected = state.voteTypes.some(v => Number(v.id) === Number(state.selectedVoteTypeId));
    if (!hasSelected) {
        state.selectedVoteTypeId = Number(state.voteTypes[0]?.id || null);
    }

    renderGroupFilter();
    renderVoteTypeFilter();
    renderSummary();

    if (!state.selectedVoteTypeId) {
        state.rankingStats = [];
        renderRankingCards();
        return;
    }

    await loadRankingBySelectedVote();
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        await authService.requireLogin();

        state.usuarioLogado = await authService.getUsuarioLogado();
        if (!state.usuarioLogado) {
            window.location.href = './login.html';
            return;
        }

        const [groups, currentGroup] = await Promise.all([
            groupService.buscarMeusGrupos(),
            loadCurrentGroup().catch(() => getCurrentGroup())
        ]);

        state.grupos = Array.isArray(groups) ? groups : [];
        if (!state.grupos.length) {
            criarMensagem('Você ainda não participa de nenhum grupo para visualizar este ranking.', MensagemTipo.INFO);
            document.querySelector('.cards').innerHTML = '<p class="fonte-secundaria">Entre em um grupo para liberar o ranking.</p>';
            return;
        }

        const defaultGroupId = Number(currentGroup?.id);
        const fallbackGroupId = Number(state.grupos[0]?.id);
        const groupId = state.grupos.some(group => Number(group.id) === defaultGroupId)
            ? defaultGroupId
            : fallbackGroupId;

        await changeGroup(groupId);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || 'Erro ao carregar dados da aplicação.', MensagemTipo.ERROR);
        } else {
            criarMensagem('Erro de conexão com o servidor.', MensagemTipo.ERROR);
        }
    } finally {
        if (container) container.classList.remove('inativo-js');
        if (loader) loader.style.display = 'none';
    }
});