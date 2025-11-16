function getFilmeById(filmeId) {
    return filmes.find(f => f.movie.id === parseInt(filmeId));
}

function getVotoDoUsuarioNoFilme(filme, usuarioId) {
    return filme.votes.find(v => v.voter.discordId === usuarioId);
}

function preencherDetalhes(filme) {
    const poster = document.querySelector('#poster img');
    poster.src = filme.posterPath || 'assets/img/placeholder-poster.png';
    poster.alt = filme.title;

    // Parte1: Título e ano
    document.querySelector('.parte1 p:first-child').textContent = filme.title;
    document.querySelector('.parte1 p:last-child').textContent = filme.year;

    // Parte2: Gêneros
    const ulGeneros = document.querySelector('.parte2 ul');
    ulGeneros.innerHTML = '';
    const li = criarElemento('li', [], filme.genre);
    ulGeneros.appendChild(li);
    // filme.genres.forEach(g => {
    //     const li = document.createElement('li');
    //     li.textContent = g;
    //     ulGeneros.appendChild(li);
    // });

    // Parte3: Diretor, duração, usuário e data
    document.querySelector('.diretor p:last-child').textContent = filme.director || 'Peter Jackson';
    document.querySelector('.duracao p').textContent = filme.duration || '2 horas';
    const linkPerfil = document.querySelector('.responsavel .link-perfil');
    linkPerfil.textContent = filme.chooser.name;
    linkPerfil.href = `./perfil.html?id=${filme.chooser.discordId}`;
    document.querySelector('.data-adicionado p').textContent = formatarData(filme.dateAdded);

    // Sinopse
    document.querySelector('#sinopse p').textContent = filme.synopsis || 'Aqui vai a sinopse do filme. Pode ser um texto longo, e ele ocupará a linha inteira abaixo do poster e das informações.';
}

function preencherAvaliacoes(filme, usuario) {
    const botao = document.querySelector('#botao-avaliar button');
    const minhaAvaliacao = document.querySelector('#minha-avaliacao');

    atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao);
    renderizarResumoVotos(filme.votes);
    renderizarAvaliacoesRecebidas(filme.votes);
}

function atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao) {
    const usuarioVotou = isUsuarioVotouNoFilme(filme.votes, usuario.discordId);

    if (usuarioVotou) {
        botao.textContent = 'Alterar Avaliação';
        minhaAvaliacao.style.display = 'block';

        const voto = getVotoDoUsuarioNoFilme(filme, usuario.discordId);
        const span = minhaAvaliacao.querySelector('span');
        span.textContent = voto.vote.emoji + voto.vote.description;
        span.style.color = voto.vote.color;
    } else {
        botao.textContent = 'Avaliar Filme';
        minhaAvaliacao.style.display = 'none';
    }

    botao.addEventListener('click', () => {
        abrirModalAvaliacao(filme, usuario);
    });
}

function abrirModalAvaliacao(filme, usuario) {
    const modal = document.querySelector('#modal-avaliar');
    modal.classList.remove('inativo');
    modal.classList.add('ativo');

    const opcoesContainer = modal.querySelector('#opcoes-voto ul');
    opcoesContainer.innerHTML = '';

    votos.forEach(v => {
        const li = document.createElement('li');
        li.textContent = v.emoji + v.description;
        li.style.background = v.color;
        li.style.cursor = 'pointer';

        li.addEventListener('click', () => {
            // TODO enviar o voto para a api
            console.log(`Usuário ${usuario.name} votou: ${v.description}`);

            modal.classList.add('inativo');

            const botao = document.querySelector('#botao-avaliar button');
            const minhaAvaliacao = document.querySelector('#minha-avaliacao');
            atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao);

            fecharModal(modal);
        });

        opcoesContainer.appendChild(li);
    });

    modal.querySelector('.close').onclick = () => fecharModal(modal);

    modal.addEventListener('click', e => {
        if (e.target === modal) fecharModal(modal);
    });
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => {
        modal.classList.add('inativo');
    }, 300); 
}

function renderizarResumoVotos(votos) {
    const contagem = {};

    votos.forEach(voto => {
        const key = `${voto.vote.emoji} ${voto.vote.description}`;
        if (contagem[key]) {
            contagem[key].qtd++;
        } else {
            contagem[key] = {
                qtd: 1,
                color: voto.vote.color,
                emoji: voto.vote.emoji,
                descricao: voto.vote.description
            };
        }
    });

    const container = document.querySelector('#avaliacoes span');
    container.innerHTML = '';

    Object.values(contagem).forEach(data => {
        const span = document.createElement('span');
        span.textContent = `${data.emoji} ${data.qtd} ${data.descricao}`;
        span.style.color = data.color;
        span.style.marginRight = '15px';
        container.appendChild(span);
    });
}

function renderizarAvaliacoesRecebidas(votos) {
    const listaAvaliacoes = document.querySelector('#avaliacoes-recebidas ul');
    listaAvaliacoes.innerHTML = '';

    votos.forEach(v => {
        const li = document.createElement('li');

        const a = document.createElement('a');
        a.href = `./perfil.html?id=${v.voter.discordId}`;
        a.classList.add('item-voto');

        const article = document.createElement('article');
        article.classList.add('avaliacao-feita');

        // info do usuário
        const infoUsuario = document.createElement('div');
        infoUsuario.classList.add('info-usuario');

        const votante = getUsuarioById(v.voter.discordId);

        const img = document.createElement('img');
        img.src = votante.avatar || './assets/img/placeholder-avatar.png';
        img.alt = `Avatar de ${votante.name}`;

        const divInfo = document.createElement('div');
        const pNome = document.createElement('p');
        pNome.textContent = votante.name;
        const pData = document.createElement('p');
        pData.textContent = '11/15/2025'; // formatarData(v.date);

        divInfo.append(pNome, pData);
        infoUsuario.append(img, divInfo);

        // voto
        const divVoto = document.createElement('div');
        const spanVoto = document.createElement('span');
        spanVoto.textContent = v.vote.emoji + v.vote.description;
        spanVoto.style.color = v.vote.color;
        divVoto.append(spanVoto);

        article.append(infoUsuario, divVoto);
        a.appendChild(article);
        li.appendChild(a);
        listaAvaliacoes.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const usuario = usuarioLogado('339251538998329354');
    const filmeId = getQueryParam('id');

    if (!filmeId) return console.error('ID do filme não encontrado na URL');

    const filme = getFilmeById(filmeId);
    if (!filme) return console.error('Filme não encontrado');

    preencherDetalhes(filme.movie);
    preencherAvaliacoes(filme, usuario);
});