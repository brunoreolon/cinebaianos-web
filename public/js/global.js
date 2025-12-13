export function getQueryParam(param) {
    const parametros = new URLSearchParams(location.search);
    return parametros.get(param);
}

export function isUsuarioVotouNoFilme(votes, discordId) {
    return votes.some(v => v.voter && v.voter.discordId === discordId);
}

export function criarElemento(tag, classes = [], texto = '') {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (texto) el.textContent = texto;

    return el;
}

function foiAdicionadoRecentemente(filme) {
    if (!filme.dateAdded) return false; // garante que não quebre se faltar a data
    const dataAdicionado = new Date(filme.dateAdded);
    const agora = new Date();

    const diffMs = agora - dataAdicionado;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    return diffDias <= 30;
}

function criarBadgeFilmeRecente(filme) {
    return criarElemento('div', ['badge-novo'], 'Novo');
}

export function criarFigure(filme, usuario = '') {
    const figure = criarElemento('figure', ['card']);
    figure.dataset.tmdbId = filme.tmdbId;

    const poster = criarElemento('img');
    poster.src = filme.posterPath || './assets/img/placeholder-poster.png';
    poster.alt = filme.title;
    figure.appendChild(poster);

    const divFilho = criarElemento('div', ['detalhes']);
    const titulo = criarElemento('p', ['destaque', 'card-titulo'], filme.title);
    const anoLancamento = criarElemento('p', ['ano'], filme.year);

    const divUsuario = criarElemento('div', ['responsavel']);
    const iconeUsuario = criarElemento('i', ['fa-regular', 'fa-user']);
    const linkPerfil = criarElemento('a', ['link-perfil'], filme.chooser.name);
    linkPerfil.href = `./perfil.html?id=${filme.chooser.discordId}`;
    divUsuario.append(iconeUsuario, linkPerfil);

    const divDataAdicionado = criarElemento('div', ['responsavel']);
    const iconeCalendario = criarElemento('i', ['fa-regular', 'fa-calendar']);
    const dataAdicionado = criarElemento('p', ['thin'], formatarData(filme.dateAdded));
    divDataAdicionado.append(iconeCalendario, dataAdicionado);

    divFilho.append(titulo, anoLancamento, divUsuario, divDataAdicionado);
    figure.appendChild(divFilho);

    const footer = criarFooter(filme, usuario);
    figure.appendChild(footer);

    if (foiAdicionadoRecentemente(filme)) {
        const badge = criarBadgeFilmeRecente(filme);
        figure.appendChild(badge);
    }

    const linkCard = criarElemento('a', ['card-link']);
    linkCard.href = `./detalhes-filme.html?id=${filme.id}`;
    linkCard.title = filme.title;
    linkCard.appendChild(figure);

    return linkCard;
}

export function criarFooter(filme, usuario) {
    const votos = filme.votes || []; // ← garante que sempre seja um array
    const footer = criarElemento('footer', ['card-footer']);
    const divVotos = criarElemento('div', ['gap']);
    const divMeuVoto = criarElemento('div');

    const contagem = votos.reduce((acc, v) => {
        const key = `${v.vote.emoji}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    Object.entries(contagem).forEach(([emoji, totalVotos]) => {
        const span = criarElemento('span', ['gap']);
        span.textContent = `${emoji}${totalVotos}`;
        divVotos.append(span);
    });

    if (!isUsuarioVotouNoFilme(votos, usuario.discordId)) {
        const botao = criarBotaoAvaliar(filme);
        divMeuVoto.appendChild(botao);
    } else {
        const voto = getVotoDoUsuarioFilme(usuario.discordId, votos);
        const v = criarElemento('span', [], voto.vote.emoji);
        divMeuVoto.appendChild(v);
    }

    footer.append(divVotos, divMeuVoto);

    return footer;
}

function getVotoDoUsuarioFilme(discordId, votos) {
    return votos.find(v => v.voter.discordId == discordId);
}

function criarBotaoAvaliar(filme) {
    const btnAvaliar = criarElemento('button', ['btn-avaliar'], 'Avaliar');
    btnAvaliar.type = 'button';

    // só na página de cards (home) previne redirecionamento
    btnAvaliar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        window.location.href = `./detalhes-filme.html?id=${filme.id}&avaliar=1`;
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
    dadosFilmes: () => document.getElementById('dados-filmes'),
    aguardandoAvaliacao: () => document.querySelector('.aguardando-avaliacao .inline'),
    todos: () => document.querySelector('.todos .inline'),
    filmesRecentes: () => document.querySelector('.recentes .inline'),
    modalNovoFilme: () => document.getElementById('modal-novo-filme')
}