function criarPainelPerfilUsuario() {
    const discordId = getQueryParam('id');
    const usuario = getUsuarioById(discordId);

    criarPainelDadosUsuario(usuario);
    criarPainelInformacoes(usuario);
}

function criarPainelDadosUsuario(usuario) {
    const divDadosUsuario = form.dadosUsuario();

    divDadosUsuario.innerHTML = '';

    if (!usuario) {
        divDadosUsuario.textContent = 'Usuário não encontrado';
        return;
    }

    // Imagem do usuário
    const divImagemPerfil = criarElemento('div', ['image']);
    const img = criarElemento('img');
    img.src = usuario.avatar || './assets/img/placeholder-avatar.png';
    divImagemPerfil.appendChild(img);

    // Informações do usuário
    const divInformacoes = criarElemento('div');

    const nome = criarElemento('p', ['fonte-primaria', 'grande'], usuario.name);
    const biografia = criarElemento('p', ['fonte-secundaria'], "Uma biografia qualquer aqui neste espaço");

    // Linha "Membro desde"
    const divMembroDesde = criarLinhaIconeTexto('fa-solid fa-calendar', usuario.created);

    divInformacoes.append(nome, biografia, divMembroDesde);
    divDadosUsuario.append(divImagemPerfil, divInformacoes);
}

function criarLinhaIconeTexto(classeIcone, texto) {
    const container = criarElemento('div', ['membro-desde']);

    if (classeIcone) {
        const icone = criarElemento('i', classeIcone.split(' '));
        container.appendChild(icone);
    }

    const p = criarElemento('p', ['fonte-secundaria'], texto);
    container.appendChild(p);

    return container;
}

function criarTotalAdicionado(totalFilmesAdicionados, descricao) {
    const divPai = criarElemento('div');

    const divFilho = criarElemento('p', ['flex']);
    const icone = criarElemento('i', ['fa-solid', 'fa-film', 'grande']);

    const quantidade = criarElemento('p', ['grande', 'sem-margin'], totalFilmesAdicionados);
    const desc = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    divFilho.append(icone, quantidade);
    divPai.append(divFilho, desc);

    return divPai;
}

function criarTotalPorVoto(emoji, totalVotosRecebidosPorVoto, descricao) {
    const divPai = criarElemento('div');

    const divFilho = criarElemento('p', ['flex']);
    const icone = criarElemento('i', [], emoji);

    const quantidade = criarElemento('p', ['grande', 'sem-margin'], totalVotosRecebidosPorVoto);
    const desc = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    divFilho.append(icone, quantidade);
    divPai.append(divFilho, desc);

    return divPai;
}

function criarTotalVotos(totalVotosRecebidos, descricao) {
    const divPai = criarElemento('div');

    const divFilho = criarElemento('p', ['flex']);

    const quantidade = criarElemento('p', ['grande', 'sem-margin'], totalVotosRecebidos);
    const desc = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    divFilho.append(quantidade);
    divPai.append(divFilho, desc);

    return divPai;
}

function criarPainelInformacoes(usuario) {
    const divDadosFilmes = form.dadosFilmes();

    const totalFilmesAdicionados = totalFilmesDoUsario(usuario.discordId);
    const totalAdicionados = criarTotalAdicionado(totalFilmesAdicionados, 'Adicionados');

    divDadosFilmes.appendChild(totalAdicionados);

    let totalVotosRecebidos = 0;
    votos.forEach(v => {
        let totalVotosRecebidosPorVoto = contarVotosRecebidosPorTipo(usuario.discordId, v.id);
        totalVotosRecebidos += totalVotosRecebidosPorVoto;
        const dados = criarTotalPorVoto(v.emoji, totalVotosRecebidosPorVoto, v.description);

        divDadosFilmes.appendChild(dados);
    });

    const totalVotos = criarTotalVotos(totalVotosRecebidos, 'Total de Votos');
    divDadosFilmes.appendChild(totalVotos);
}

function criarListaVotos() {
    const discordId = getQueryParam('id');
    const usuario = getUsuarioById(discordId);

    const lista = form.lista();

    const liAdicionados = adicionarItem(true, usuario.discordId, 0, 'Adicionados');
    liAdicionados.classList.add('ativo')
    lista.appendChild(liAdicionados);

    votos.forEach(v =>{
        const li = adicionarItem(false, usuario.discordId, v.id, v.description);
        lista.appendChild(li);
    });

    const liTodos = adicionarItem(false, usuario.discordId, -1, 'Todos');
    lista.appendChild(liTodos);

    criarCardsFilmes(true, usuario, 0);
}

function adicionarItem(filmesUsuario, discordId, votoId, descricao) {
    let total = 0;
    if (filmesUsuario) {
        total = totalFilmesDoUsario(discordId);
    } else if (votoId === -1) {
        total = contarTodosVotosRecebidos(discordId);
    } else {
        total = contarVotosRecebidosPorTipo(discordId, votoId);
    }

    const descricaoCompleta = descricao + " (" + total + ")";

    const li = criarElemento('li');
    li.dataset.valor = votoId;

    let emoji = '';
    if (!filmesUsuario && votoId > 0) {
        const voto = votos.find(v => v.id === votoId);
        emoji = voto ? voto.emoji : '';
    } else if (filmesUsuario) {
        emoji = '🎬';
    } else if (votoId === -1) {
        emoji = '🗂️';
    }

    const spanTexto = criarElemento('span', ['texto'], descricaoCompleta);
    const spanIcone = criarElemento('span', ['icone'], emoji);

    li.append(spanTexto, spanIcone);

    return li;
}

function selecionaItemLista() {
    const discordId = getQueryParam('id');
    const usuario = getUsuarioById(discordId);
    const lista = form.lista();

    lista.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            lista.querySelectorAll('li').forEach(item => item.classList.remove('ativo'));
            e.target.classList.add('ativo');

            const valor = parseInt(e.target.dataset.valor);
            const filmesUsuario = valor === 0;
            criarCardsFilmes(filmesUsuario, usuario, valor);
        }
    });
}

function criarCardsFilmes(filmesUsuario, usuario, votoId) {
    const divPai = form.divPai();

    divPai.classList.remove('borda-padrao', 'mensagem');
    divPai.innerHTML = '';

    const filmesFiltrados = filmes.filter(filme => {
        if (filmesUsuario) {
            return filme.movie.chooser.discordId === usuario.discordId;
        }

        return filme.votes.some(v =>
            v.voter.discordId === usuario.discordId &&
            (votoId === 0 || votoId === -1 || v.vote.id === votoId)
        );
    });

    if (filmesFiltrados.length === 0) {
        divPai.classList.add('borda-padrao', 'mensagem');
        const mensagem = criarElemento('p', ['fonte-secundaria'], 'Nenhum filme adicionado ainda.');
        divPai.appendChild(mensagem);
    }

    filmesFiltrados.forEach(f => {
        const figure = criarFigure(f, usuario.discordId);
        divPai.appendChild(figure);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    criarPainelPerfilUsuario();
    criarListaVotos();
    selecionaItemLista();
});