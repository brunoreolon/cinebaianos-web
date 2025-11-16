function getQueryParam(param) {
    const parametros = new URLSearchParams(location.search);
    return parametros.get(param);
}

function getUsuarioById(discordId) {
    return usuarios.find(u => u.discordId === discordId);
}

function usuarioLogado(discordId) {
    return getUsuarioById(discordId);
}

function isUsuarioVotouNoFilme(votes, discordId) {
    return votes.some(v => v.voter && v.voter.discordId === discordId);
}

function criarElemento(tag, classes = [], texto = '') {
    const el = document.createElement(tag);
    if (classes.length) el.classList.add(...classes);
    if (texto) el.textContent = texto;

    return el;
}

function foiAdicionadoRecentemente(filme) {
    const dataAdicionado = new Date(filme.movie.dateAdded);
    const agora = new Date();

    const diffMs = agora - dataAdicionado;
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    return diffDias <= 30;
}

function criarBadgeFilmeRecente(filme) {
    return criarElemento('div', ['badge-novo'], 'Novo');
}

function criarFigure(f, discordId) {
    const filme = f.movie

    const figure = criarElemento('figure', ['card']);

    const poster = criarElemento('img');
    poster.src = filme.posterPath || 'assets/img/placeholder-poster.png';
    poster.alt = filme.title;
    figure.appendChild(poster);

    const divFilho = criarElemento('div', ['detalhes']);
    const titulo = criarElemento('p', ['destaque', 'titulo'], filme.title);
    const anoLancamento = criarElemento('p', ['ano'], filme.year);

    const divUsuario = criarElemento('div', ['responsavel']);
    const iconeUsuario = criarElemento('i', ['fa-regular', 'fa-user']);
    const linkPerfil = criarElemento('a', ['link-perfil'], filme.chooser.name);
    linkPerfil.href = `perfil.html?id=${filme.chooser.discordId}`;
    divUsuario.append(iconeUsuario, linkPerfil);

    const divDataAdicionado = criarElemento('div', ['responsavel']);
    const iconeCalendario = criarElemento('i', ['fa-regular', 'fa-calendar']);
    const dataAdicionado = criarElemento('p', ['thin'], formatarData(filme.dateAdded));
    divDataAdicionado.append(iconeCalendario, dataAdicionado);

    divFilho.append(titulo, anoLancamento, divUsuario, divDataAdicionado);
    figure.appendChild(divFilho);

    if (!isUsuarioVotouNoFilme(f.votes, discordId)) {
        const botao = criarBotaoAvaliar();
        figure.appendChild(botao);
    }

    if (foiAdicionadoRecentemente(f)) {
        const badge = criarBadgeFilmeRecente(f);
        figure.appendChild(badge);
    }

    const linkCard = criarElemento('a', ['card-link']);
    linkCard.href = `detalhes-filme.html?id=${f.movie.id}`
    linkCard.appendChild(figure);

    return linkCard;
}

function criarBotaoAvaliar() {
    const btnAvaliar = criarElemento('button', ['btn-avaliar'], 'Avaliar');
    btnAvaliar.type = 'button';

    return btnAvaliar
}

function obterElementoPaiByClass(clazz) {
    return document.querySelector(clazz);
}

function formatarData(dataStr) {
    const data = new Date(dataStr);

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

const form = {
    menuPerfil: () =>document.querySelector('.profile-menu'),
    avatarContainer: () => document.querySelector('#avatar-container'),
    dropdownContainer: () => document.querySelector('#dropdown-container'),
    lista: () => document.getElementById('lista'),
    divPai: () => document.querySelector('.inline'), 
    dadosUsuario: () => document.getElementById('dados-usuario'),
    dadosFilmes: () => document.getElementById('dados-filmes')
}