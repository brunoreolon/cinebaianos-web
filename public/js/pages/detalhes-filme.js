import { requireLogin, getUsuarioLogado } from '../auth.js';
import { buscarFilmePorId, excluirFilme } from '../services/filme-service.js';
import { abrirModalAvaliacao } from './modal-avaliar.js';
import { getQueryParam, formatarData, isUsuarioVotouNoFilme, criarElemento, ordenarVotosPorNomeUsuario } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

function getVotoDoUsuarioNoFilme(filme, usuarioId) {
    return filme.votes.find(v => v.voter.discordId === usuarioId);
}

function preencherDetalhes(filme) {
    const btnRemoverFilme = document.querySelector('.btn-remover-filme');
    btnRemoverFilme?.addEventListener('click', async () => {
        const confirmar = confirm('Você tem certeza que deseja remover este filme?');
        if (!confirmar) return;

        try {
            await excluirFilme(filme.id);
            sessionStorage.setItem("flashMessage", JSON.stringify({
                texto: "Filme removido com sucesso.",
                tipo: "SUCCESS"
            }));
            window.location.href = "./index.html";
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || "Erro ao excluir filme.", MensagemTipo.ERROR);
            } else {
                criarMensagem(err.message || "Erro inesperado.", MensagemTipo.ERROR);
            }
        }
    });

    const poster = document.querySelector('#poster img');
    poster.src = filme.posterPath || 'assets/img/placeholder-poster.png';
    poster.alt = filme.title;

    // Parte1: Título e ano
    document.querySelector('.parte1 p:first-child').textContent = filme.title;
    document.querySelector('.parte1 p:last-child').textContent = filme.year;

    // Parte2: Gêneros
    const ulGeneros = document.querySelector('.parte2 ul');
    ulGeneros.innerHTML = '';
    filme.genres.forEach(g => {
        const li = document.createElement('li');
        li.textContent = g.name;
        ulGeneros.appendChild(li);
    });

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

    botao.addEventListener('click', () => {
        abrirModalAvaliacao(filme, usuario, true, false);
    });
}

export function atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao) {
    const usuarioVotou = isUsuarioVotouNoFilme(filme.votes, usuario.discordId);

    if (usuarioVotou) {
        botao.textContent = 'Alterar Avaliação';
        minhaAvaliacao.style.display = 'block';

        const voto = getVotoDoUsuarioNoFilme(filme, usuario.discordId);
        const span = minhaAvaliacao.querySelector('span');
        span.textContent = voto.vote.emoji + voto.vote.description;
        span.style.color = voto.vote.color;
        
        const aviso = document.querySelector('#avaliacoes-recebidas .sem-avaliacoes');
        if (aviso) aviso.textContent = '';
    } else {
        botao.textContent = 'Avaliar Filme';
        minhaAvaliacao.style.display = 'none';
    }

    const votosOrdenadosPorUsuario = ordenarVotosPorNomeUsuario(filme.votes);

    renderizarResumoVotos(filme.votes);
    renderizarAvaliacoesRecebidas(votosOrdenadosPorUsuario);
}

export function renderizarResumoVotos(votos) {
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

    const votosOrdenados = Object.values(contagem).sort((a, b) => b.qtd - a.qtd);

    votosOrdenados.forEach(data => {
        const span = document.createElement('span');
        span.textContent = `${data.emoji} ${data.qtd} ${data.descricao}`;
        span.style.color = data.color;
        span.style.marginRight = '15px';
        container.appendChild(span);
    });
}

export function renderizarAvaliacoesRecebidas(votos) {
    const listaAvaliacoes = document.querySelector('#avaliacoes-recebidas');
    const h3 = listaAvaliacoes.querySelector('h3');
    const ul = listaAvaliacoes.querySelector('ul');

    h3.textContent = `Avaliações (${votos.length})`;
    ul.innerHTML = '';

    if (votos.length === 0) {
        const p = criarElemento('p', ['fonte-secundaria', 'sem-avaliacoes'], 'Nenhuma avaliação recebida ainda.');
        p.style.textAlign = 'center';
        listaAvaliacoes.appendChild(p);
        return;
    }

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

        const votante = v.voter;

        const img = document.createElement('img');
        img.src = votante.avatar || './assets/img/placeholder-avatar.png';
        img.alt = `Avatar de ${votante.name}`;

        const divInfo = document.createElement('div');
        const pNome = document.createElement('p');
        pNome.textContent = votante.name;
        const pData = document.createElement('p');
        pData.textContent = formatarData(v.vote.votedAt); 

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
        ul.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        requireLogin();

        const usuario = await getUsuarioLogado();
        if (!usuario) {
            window.location.href = "./login.html";
            return;
        }

        const filmeId = getQueryParam('id');

        if (!filmeId) throw new Error('ID do filme não encontrado na URL');

        const filme = await buscarFilmePorId(filmeId);
        if (!filme) throw new Error('Filme não encontrado');

        const deveAvaliar = getQueryParam('avaliar');
        if (deveAvaliar === '1') {
            abrirModalAvaliacao(filme, usuario, true, false);

            const novaURL = window.location.pathname + window.location.search.replace(/(&)?avaliar=1/, '');
            window.history.replaceState({}, '', novaURL);
        }

        preencherDetalhes(filme);
        preencherAvaliacoes(filme, usuario);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao carregar detalhes do filme.", MensagemTipo.ERROR);
        } else {
            criarMensagem(err.message || "Erro ao carregar detalhes do filme.", MensagemTipo.ERROR);
        }
    }
});

window.addEventListener('filmeAtualizado', async (e) => {
    try {
        const filmeAtualizado = e.detail;

        const usuario = await getUsuarioLogado();
        if (!usuario) {
            window.location.href = "./login.html";
            return;
        }
        
        const botao = document.querySelector('#botao-avaliar button');
        const minhaAvaliacao = document.querySelector('#minha-avaliacao');

        atualizarBotaoEMinhaAvaliacao(filmeAtualizado, usuario, botao, minhaAvaliacao);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao atualizar avaliação.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro ao atualizar avaliação.", MensagemTipo.ERROR);
        }
    }
});
