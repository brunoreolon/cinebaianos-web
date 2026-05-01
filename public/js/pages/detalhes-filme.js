import { authService } from '../services/auth-service.js';
import { filmeService } from '../services/filme-service.js';
import { abrirModalAvaliacao } from './modal-avaliar.js';
import { getQueryParam, formatarData, isUsuarioVotouNoFilme, criarElemento, ordenarVotosPorNomeUsuario, deduplicarVotosPorUsuario, buildPerfilUrl } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';
import { getCurrentGroup, loadCurrentGroup, setFlashMessage } from '../services/group-context.js';

// ID do grupo atual — preenchido na inicialização
let currentGroupId = null;

function parseNullableNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeDetalhesFilmeUrl(filmeId, groupId, shouldKeepAvaliar) {
    const url = new URL(window.location.href);
    url.searchParams.set('id', String(filmeId));
    url.searchParams.set('groupId', String(groupId));

    if (shouldKeepAvaliar) {
        url.searchParams.set('avaliar', '1');
    } else {
        url.searchParams.delete('avaliar');
    }

    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
}

function criarAcaoEstadoVazio(href, iconClass, texto) {
    const link = criarElemento('a', ['detalhes-filme-empty-action']);
    link.href = href;
    link.innerHTML = `<i class="${iconClass}"></i><span>${texto}</span>`;
    return link;
}

function renderizarEstadoVazioFilme({ groupId, groupName }) {
    const detalhesFilme = document.getElementById('detalhes-filme');
    if (!detalhesFilme) return;

    detalhesFilme.classList.add('detalhes-filme-empty');
    detalhesFilme.innerHTML = '';

    const emptyState = criarElemento('div', ['catalog-empty-state', 'detalhes-filme-empty-state']);

    const icon = criarElemento('i', ['fa-solid', 'fa-film']);
    const titulo = criarElemento('strong', [], 'Este filme não está disponível no grupo atual');
    const descricao = criarElemento(
        'span',
        [],
        groupName
            ? `O filme que você tentou abrir não foi encontrado em "${groupName}". Você pode voltar para a lista de filmes do grupo atual ou abrir os detalhes do grupo para explorar outras opções.`
            : 'O filme que você tentou abrir não foi encontrado no grupo selecionado. Volte para a lista de filmes e escolha outro título.'
    );
    const actions = criarElemento('div', ['detalhes-filme-empty-actions']);

    actions.appendChild(criarAcaoEstadoVazio('./catalogo.html', 'fa-solid fa-house', 'Ver filmes do grupo'));

    if (groupId) {
        actions.appendChild(criarAcaoEstadoVazio(`./detalhes-grupo.html?id=${groupId}`, 'fa-solid fa-people-group', 'Abrir detalhes do grupo'));
    }

    emptyState.append(icon, titulo, descricao, actions);
    detalhesFilme.appendChild(emptyState);
}

function getVotoDoUsuarioNoFilme(filme, usuarioId) {
    const votos = deduplicarVotosPorUsuario(filme.votes || []);
    return votos.find(v => Number(v?.voter?.id) === Number(usuarioId));
}

function preencherDetalhes(filme, usuario) {
    const btnRemoverFilme = document.querySelector('.btn-remover-filme');

    if (Number(filme?.chooser?.id) === Number(usuario?.id)) {
        btnRemoverFilme.classList.remove('disable');

        btnRemoverFilme?.addEventListener('click', async () => {
        const confirmar = confirm('Você tem certeza que deseja remover este filme?');
        if (!confirmar) return;

        try {
            await filmeService.removerFilmeDoGrupo(currentGroupId, filme.id);
            sessionStorage.setItem("flashMessage", JSON.stringify({
                texto: "Filme removido com sucesso.",
                tipo: "SUCCESS"
            }));
            window.location.href = "./catalogo.html";
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || "Erro ao excluir filme.", MensagemTipo.ERROR);
            } else {
                criarMensagem(err.message || "Erro inesperado.", MensagemTipo.ERROR);
            }
        }
    });
    } else {
        btnRemoverFilme.classList.add('disable');
    }
    
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
        const li = criarElemento('li', [], g.name);
        ulGeneros.appendChild(li);
    });

    // Parte3: Diretor, duração, usuário e data
    document.querySelector('.diretor .nome-diretor').textContent = filme.director || 'Peter Jackson';
    document.querySelector('.duracao p').textContent = filme.duration || '2 horas';
    const linkPerfil = document.querySelector('.responsavel .link-perfil');
    linkPerfil.textContent = filme.chooser.name;
    linkPerfil.href = buildPerfilUrl(filme.chooser);
    document.querySelector('.data-adicionado p').textContent = formatarData(filme.dateAdded);

    // Sinopse
    document.querySelector('#sinopse p').textContent = filme.synopsis || 'Aqui vai a sinopse do filme. Pode ser um texto longo, e ele ocupará a linha inteira abaixo do poster e das informações.';
}

function preencherAvaliacoes(filme, usuario) {
    const botao = document.querySelector('#botao-avaliar button');
    const minhaAvaliacao = document.querySelector('#minha-avaliacao');

    atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao);

    botao.addEventListener('click', () => {
        abrirModalAvaliacao(filme, usuario, true, false, currentGroupId);
    });
}

export function atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao) {
    const votosDeduplicados = deduplicarVotosPorUsuario(filme.votes || []);
    const usuarioVotou = isUsuarioVotouNoFilme(votosDeduplicados, usuario.id);

    if (usuarioVotou) {
        botao.innerHTML = '<i class="fa-solid fa-pen"></i><span>Alterar avaliação</span>';
        minhaAvaliacao.style.display = 'block';

        const voto = getVotoDoUsuarioNoFilme(filme, usuario.id);
        const span = minhaAvaliacao.querySelector('span');
        span.textContent = voto.vote.emoji + voto.vote.description;
        span.style.color = voto.vote.color;
        
        const aviso = document.querySelector('#avaliacoes-recebidas .sem-avaliacoes');
        if (aviso) aviso.textContent = '';
    } else {
        botao.innerHTML = '<i class="fa-solid fa-star"></i><span>Avaliar filme</span>';
        minhaAvaliacao.style.display = 'none';
    }

    const votosOrdenadosPorUsuario = ordenarVotosPorNomeUsuario(votosDeduplicados);

    renderizarResumoVotos(votosDeduplicados);
    renderizarAvaliacoesRecebidas(votosOrdenadosPorUsuario);
}

export function renderizarResumoVotos(votos) {
    const votosDeduplicados = deduplicarVotosPorUsuario(votos || []);
    const contagem = {};

    votosDeduplicados.forEach(voto => {
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
        const span = criarElemento('span', [], `${data.emoji} ${data.qtd} ${data.descricao}`);
        span.style.color = data.color;
        container.appendChild(span);
    });
}

export function renderizarAvaliacoesRecebidas(votos) {
    const votosDeduplicados = deduplicarVotosPorUsuario(votos || []);
    const listaAvaliacoes = document.querySelector('#avaliacoes-recebidas');
    const h3 = listaAvaliacoes.querySelector('h3');
    const ul = listaAvaliacoes.querySelector('ul');
    listaAvaliacoes.querySelector('.sem-avaliacoes')?.remove();

    h3.textContent = `Avaliações (${votosDeduplicados.length})`;
    ul.innerHTML = '';

    if (votosDeduplicados.length === 0) {
        const p = criarElemento('p', ['fonte-secundaria', 'sem-avaliacoes'], 'Nenhuma avaliação recebida ainda.');
        listaAvaliacoes.appendChild(p);
        return;
    }

    votosDeduplicados.forEach(v => {
        const li = criarElemento('li');

        const a = criarElemento('a', ['item-voto']);
        a.href = buildPerfilUrl(v.voter);

        const article = criarElemento('article', ['avaliacao-feita']);
        const infoUsuario = criarElemento('div', ['info-usuario']);
        const votante = v.voter;

        const img = criarElemento('img');
        img.src = votante.avatar || './assets/img/placeholder-avatar.png';
        img.alt = `Avatar de ${votante.name}`;

        const divInfo = criarElemento('div', ['dados-usuario']);
        const pNome = criarElemento('p', [], votante.name);
        const pData = criarElemento('p', [], formatarData(v.vote.votedAt));

        divInfo.append(pNome, pData);
        infoUsuario.append(img, divInfo);

        // voto
        const divVoto = criarElemento('div');
        const spanVoto = criarElemento('span', ['voto-usuario']);
        spanVoto.style.color = v.vote.color;
        spanVoto.title = v.vote.description;

        const emoji = document.createTextNode(v.vote.emoji);
        const descVoto = criarElemento('span', ['descricao'], v.vote.description);

        spanVoto.append(emoji, descVoto);
        divVoto.append(spanVoto);

        article.append(infoUsuario, divVoto);
        a.appendChild(article);
        li.appendChild(a);
        ul.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        authService.requireLogin();

        const usuario = await authService.getUsuarioLogado();
        if (!usuario) {
            window.location.href = "./login.html";
            return;
        }

        const filmeId = getQueryParam('id');
        const groupIdFromQuery = parseNullableNumber(getQueryParam('groupId'));
        const avaliarFromQuery = getQueryParam('avaliar') === '1';

        let grupo = getCurrentGroup();
        if (!grupo) {
            grupo = await loadCurrentGroup();
        }

        const currentSelectedGroupId = parseNullableNumber(grupo?.id);
        currentGroupId = currentSelectedGroupId || groupIdFromQuery || null;

        if (!filmeId) {
            setFlashMessage('Filme inválido para exibir detalhes.', 'ALERT');
            window.location.href = './catalogo.html';
            return;
        }

        if (!currentGroupId) {
            setFlashMessage('Selecione um grupo para visualizar os detalhes do filme.', 'ALERT');
            window.location.href = './meus-grupos.html';
            return;
        }

        if (groupIdFromQuery !== currentGroupId) {
            normalizeDetalhesFilmeUrl(filmeId, currentGroupId, avaliarFromQuery);
        }

        const filme = await filmeService.buscarFilmeDoGrupo(currentGroupId, filmeId);
        if (!filme) {
            renderizarEstadoVazioFilme({
                groupId: currentGroupId,
                groupName: grupo?.name || null
            });
            return;
        }

        if (avaliarFromQuery) {
            abrirModalAvaliacao(filme, usuario, true, false, currentGroupId);
            normalizeDetalhesFilmeUrl(filmeId, currentGroupId, false);
        }

        preencherDetalhes(filme, usuario,);
        preencherAvaliacoes(filme, usuario);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao carregar detalhes do filme.", MensagemTipo.ERROR);
        } else {
            criarMensagem(err.message || "Erro ao carregar detalhes do filme.", MensagemTipo.ERROR);
        }
    } finally {
        if (container) container.classList.remove('inativo-js');  
        if (loader) loader.style.display = 'none';
    }
});

window.addEventListener('filmeAtualizado', async (e) => {
    try {
        const filmeAtualizado = e.detail;

        const usuario = await authService.getUsuarioLogado();
        if (!usuario) {
            window.location.href = "./login.html";
            return;
        }
        
        const botao = document.querySelector('#botao-avaliar button');
        const minhaAvaliacao = document.querySelector('#minha-avaliacao');

        if (!botao || !minhaAvaliacao) return;

        atualizarBotaoEMinhaAvaliacao(filmeAtualizado, usuario, botao, minhaAvaliacao);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao atualizar avaliação.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro ao atualizar avaliação.", MensagemTipo.ERROR);
        }
    }
});
