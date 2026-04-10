import { FILME_RECENTE_DIAS } from '../../../config.js';

export function getQueryParam(param) {
    const parametros = new URLSearchParams(location.search);
    return parametros.get(param);
}

export function isUsuarioVotouNoFilme(votes, discordId) {
    return deduplicarVotosPorUsuario(votes).some(v => v.voter && v.voter.discordId === discordId);
}

export function deduplicarVotosPorUsuario(votos = []) {
    const porUsuario = new Map();

    votos.forEach(voto => {
        const discordId = voto?.voter?.discordId;
        if (!discordId) return;

        const atual = porUsuario.get(discordId);
        if (!atual) {
            porUsuario.set(discordId, voto);
            return;
        }

        const atualData = new Date(atual?.vote?.votedAt || 0).getTime();
        const novaData = new Date(voto?.vote?.votedAt || 0).getTime();
        if (novaData >= atualData) {
            porUsuario.set(discordId, voto);
        }
    });

    return [...porUsuario.values()];
}

export function criarElemento(tag, classes = [], texto = '') {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (texto) el.textContent = texto;

    return el;
}

function obterJanelaFilmeNovoDias(filme, options = {}) {
    const diasBackend = Number(options.movieNewDays ?? filme?.movieNewDays ?? filme?.group?.movieNewDays);
    if (Number.isFinite(diasBackend) && diasBackend >= 0) {
        return diasBackend;
    }

    const diasPadrao = Number(FILME_RECENTE_DIAS);
    return Number.isFinite(diasPadrao) && diasPadrao >= 0 ? diasPadrao : 0;
}

function foiAdicionadoRecentemente(filme, options = {}) {
    if (!filme.dateAdded) return false;

    const diasLimite = obterJanelaFilmeNovoDias(filme, options);
    if (diasLimite <= 0) return false;

    const dataAdicionado = new Date(filme.dateAdded);
    const agora = new Date();

    const diffMs = agora - dataAdicionado;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    return diffDias <= diasLimite;
}

function criarBadgeFilmeRecente() {
    return criarElemento('div', ['badge-novo'], 'Novo');
}

export function buildDetalhesFilmeUrl(filmeId, options = {}) {
    const url = new URL('./detalhes-filme.html', window.location.origin);
    url.searchParams.set('id', String(filmeId));

    if (options.groupId !== null && options.groupId !== undefined && options.groupId !== '') {
        url.searchParams.set('groupId', String(options.groupId));
    }

    if (options.avaliar) {
        url.searchParams.set('avaliar', '1');
    }

    return `${url.pathname}${url.search}`;
}

export function criarFigure(filme, usuario = '', options = {}) {
    const figure = criarElemento('figure', ['card']);
    figure.dataset.tmdbId = filme.tmdbId;

    const usuarioJaVotou = usuario?.discordId ? isUsuarioVotouNoFilme(filme.votes || [], usuario.discordId) : false;
    if (usuarioJaVotou) {
        figure.classList.add('card-has-user-vote');
    }

    const posterWrapper = criarElemento('div', ['card-poster']);
    const posterPath = filme.posterPath || './assets/img/placeholder-poster.png';
    if (!filme.posterPath) {
        posterWrapper.classList.add('card-poster--placeholder');
    }

    const poster = criarElemento('img');
    poster.classList.add('card-poster-image');
    if (!filme.posterPath) {
        poster.classList.add('is-placeholder');
    }
    poster.src = posterPath;
    poster.alt = filme.title;
    posterWrapper.appendChild(poster);
    figure.appendChild(posterWrapper);

    const divFilho = criarElemento('div', ['detalhes', 'card-body']);
    const titulo = criarElemento('p', ['destaque', 'card-titulo'], filme.title);
    const anoLancamento = criarElemento('p', ['ano'], filme.year);
    const metaList = criarElemento('div', ['card-meta-list']);

    const divUsuario = criarElemento('div', ['responsavel', 'card-meta-item']);
    const iconeUsuario = criarElemento('i', ['fa-regular', 'fa-user']);
    const linkPerfil = criarElemento('a', ['link-perfil'], filme.chooser.name);
    linkPerfil.href = `./perfil.html?id=${filme.chooser.discordId}`;
    divUsuario.append(iconeUsuario, linkPerfil);

    const divDataAdicionado = criarElemento('div', ['responsavel', 'card-meta-item']);
    const iconeCalendario = criarElemento('i', ['fa-regular', 'fa-calendar']);
    const dataAdicionado = criarElemento('p', ['thin'], formatarData(filme.dateAdded));
    divDataAdicionado.append(iconeCalendario, dataAdicionado);

    metaList.append(divUsuario, divDataAdicionado);
    divFilho.append(titulo, anoLancamento, metaList);
    figure.appendChild(divFilho);

    const footer = criarFooter(filme, usuario, options);
    figure.appendChild(footer);

    if (foiAdicionadoRecentemente(filme, options)) {
        const badge = criarBadgeFilmeRecente();
        figure.appendChild(badge);
    }

    const linkCard = criarElemento('a', ['card-link']);
    linkCard.href = buildDetalhesFilmeUrl(filme.id, { groupId: options.groupId });
    linkCard.title = filme.title;
    linkCard.appendChild(figure);

    return linkCard;
}

export function criarFooter(filme, usuario, options = {}) {
    const votos = deduplicarVotosPorUsuario(filme.votes || []);
    const footer = criarElemento('footer', ['card-footer']);
    const divVotos = criarElemento('div', ['gap', 'card-votes-summary']);
    const divMeuVoto = criarElemento('div', ['card-user-vote']);

    const contagem = votos.reduce((acc, v) => {
        const emoji = v.vote.emoji;
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
    }, {});

    // Ordenar do maior para o menor
    const votosOrdenados = Object.entries(contagem).sort(([, a], [, b]) => b - a);
    if (votosOrdenados.length > 3) {
        divVotos.classList.add('card-votes-summary--dense');
    }

    votosOrdenados.forEach(([emoji, total]) => {
        const span = criarElemento('span', ['gap', 'card-vote-chip']);
        span.textContent = `${emoji}${total}`;
        divVotos.appendChild(span);
    });

    if (!isUsuarioVotouNoFilme(votos, usuario.discordId)) {
        const botao = criarBotaoAvaliar(filme, options);
        divMeuVoto.appendChild(botao);
    } else {
        divMeuVoto.classList.add('has-vote');
        const voto = getVotoDoUsuarioFilme(usuario.discordId, votos);
        const v = criarElemento('span', ['card-user-vote-emoji', 'card-user-vote-emoji--active'], voto.vote.emoji);
        v.title = `Seu voto: ${voto.vote.description || voto.vote.name || voto.vote.emoji}`;
        divMeuVoto.appendChild(v);
    }

    footer.append(divVotos, divMeuVoto);

    return footer;
}

function getVotoDoUsuarioFilme(discordId, votos) {
    const votosDeduplicados = deduplicarVotosPorUsuario(votos || []);
    return votosDeduplicados.find(v => String(v.voter.discordId) === String(discordId));
}

function criarBotaoAvaliar(filme, options = {}) {
    const btnAvaliar = criarElemento('button', ['btn-avaliar'], 'Avaliar');
    btnAvaliar.type = 'button';
    btnAvaliar.innerHTML = '<i class="fa-regular fa-star"></i><span>Avaliar</span>';

    // só na página de cards (home) previne redirecionamento
    btnAvaliar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        window.location.href = buildDetalhesFilmeUrl(filme.id, {
            groupId: options.groupId,
            avaliar: true
        });
    });

    return btnAvaliar
}

export function formatarData(dataStr) {
    const data = new Date(dataStr);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

export function formatarDataExtenso(dataStr) {
    if (!dataStr) return "";

    const data = new Date(dataStr);

    return data.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

export function ordenarUsuariosPorNome(usuarios) {
    return [...usuarios].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );
}

export function ordenarVotosPorDescricao(votos) {
    return [...votos].sort((a, b) =>
        a.name.localeCompare(b.description, 'pt-BR', { sensitivity: 'base' })
    );
}

export function ordenarVotosPorNomeUsuario(votos) {
    return [...votos].sort((a, b) =>
        a.voter.name.localeCompare(b.voter.name, 'pt-BR', { sensitivity: 'base' })
    );
}

export const form = {
    menuPerfil: () =>document.querySelector('.profile-menu'),
    avatarContainer: () => document.querySelector('#avatar-container'),
    dropdownContainer: () => document.querySelector('#dropdown-container'),
    lista: () => document.getElementById('lista'),
    divPai: () => document.querySelector('.inline'), 
    dadosUsuario: () => document.getElementById('dados-usuario'),
    dadosVotos: () => document.getElementById('dados-votos'),
    dadosFilmes: () => document.getElementById('dados-filmes'),
    aguardandoAvaliacao: () => document.querySelector('.aguardando-avaliacao .inline'),
    todos: () => document.querySelector('.todos .inline'),
    filmesRecentes: () => document.querySelector('.recentes .inline'),
    modalNovoFilme: () => document.getElementById('modal-novo-filme')
}