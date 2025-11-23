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

function totalFilmesDoUsario(discordId) {
    const filmesFiltrados = filmes.filter(filme => {
        return filme.movie.chooser.discordId === discordId;
    });

    return filmesFiltrados.length;
}

function contarVotosRecebidosPorTipo(discordId, votoId) {
    return filmes.reduce((total, filme) => {
        const votosDoUsuario = filme.votes.filter(v => 
            v.voter.discordId === discordId &&
            v.vote.id === votoId
        );

        return total + votosDoUsuario.length;
    }, 0);
}

function contarTodosVotosRecebidos(discordId) {
    return filmes.reduce((total, f) => {
        if (f.movie.chooser.discordId !== discordId) return total;
        return total + f.votes.length;
    }, 0);
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

function criarFigure(f, discordId = '') {
    const filme = f.movie

    const figure = criarElemento('figure', ['card']);

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

    const footer = criarFooter(f, discordId);

    figure.appendChild(footer);

    if (foiAdicionadoRecentemente(f)) {
        const badge = criarBadgeFilmeRecente(f);
        figure.appendChild(badge);
    }

    const linkCard = criarElemento('a', ['card-link']);
    linkCard.href = `./detalhes-filme.html?id=${f.movie.id}`
    linkCard.title = filme.title;
    linkCard.appendChild(figure);

    return linkCard;
}

function criarFooter(filme, discordId) {
    const votos = filme.votes;
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

    if (!isUsuarioVotouNoFilme(votos, discordId)) {
        const botao = criarBotaoAvaliar(filme);
        divMeuVoto.appendChild(botao);
    } else {
        const voto = getVotoDoUsuarioFilme(discordId, filme.votes);
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
        abrirModalAvaliacao(filme, usuarioLogado('339251538998329354'), false);
    });

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