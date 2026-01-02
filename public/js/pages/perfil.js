import { authService } from '../services/auth-service.js';
import { usuarioService } from '../services/usuario-service.js';
import { filmeService } from '../services/filme-service.js';
import { votoService } from '../services/voto-service.js';
import { getQueryParam, form, criarElemento, criarFigure, formatarData } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

async function criarPainelPerfilUsuario(usuario, stats, votosRecebidos, votosDados) {
    criarPainelDadosUsuario(usuario);
    criarPainelInformacoesVotosRecebidos(votosRecebidos);
    criarPainelInformacoesVotosDoUsuarioNosFilmes(stats, votosDados);
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
    const divInformacoes = criarElemento('div', ['dados']);

    const nome = criarElemento('p', ['fonte-primaria', 'grande', 'nome'], usuario.name);
    const biografia = criarElemento('p', ['fonte-secundaria', 'bio'], usuario.biography || "Sem biografia");

    // Linha "Membro desde"
    const divMembroDesde = criarLinhaIconeTexto('fa-solid fa-calendar', 'Membro desde  ' + formatarData(usuario.joined));

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

function criarCard({ descricao, quantidade, emoji = null, iconClass = null, iconGrande = false }) {
    const container = criarElemento('div', ['box']);
    const conteudo = criarElemento('div', ['flex', 'align-center']);
    
    if (emoji) {
        const icone = criarElemento('i', ['grande'], emoji); // emoji sempre grande
        conteudo.appendChild(icone);
    } else if (iconClass) {
        if (iconGrande) iconClass = [...iconClass, 'grande']; // adiciona classe grande se solicitado
        const icone = criarElemento('i', iconClass);
        conteudo.appendChild(icone);
    }

    const quantidadeEl = criarElemento('p', ['grande', 'sem-margin'], quantidade.toString());
    const descEl = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    conteudo.appendChild(quantidadeEl);
    container.append(conteudo, descEl);

    return container;
}

function criarPainelInformacoesVotosRecebidos(votosRecebidos) {
    const divDadosVotos = form.dadosVotos();

    for (const v of votosRecebidos.votes) {
        let total = v.totalVotes;
        let emoji = v.type.emoji;
        let descricao = v.type.description;
        
        const dados = criarCard({ descricao: descricao, quantidade: total, emoji: emoji });

        divDadosVotos.appendChild(dados);
    };
}

function criarPainelInformacoesVotosDoUsuarioNosFilmes(stats, votosStats) {
    const divDadosFilmes = form.dadosFilmes();

    const totalAdicionados = criarCard({ descricao: 'Adicionados', quantidade: stats.userStats.totalMoviesAdded, iconClass: ['fa-solid', 'fa-film'], iconGrande: true });
    divDadosFilmes.appendChild(totalAdicionados);

    votosStats.votes.forEach(v => {
        const voto = v.type;
        const dados = criarCard({ descricao: voto.description, quantidade: v.totalVotes, emoji: voto.emoji });

        divDadosFilmes.appendChild(dados);
    });

    const totalVotos = criarCard({ descricao: 'Total de Votos', quantidade: stats.userStats.totalVotesGiven, iconClass: ['fa-solid', 'fa-star'], iconGrande: true });
    divDadosFilmes.appendChild(totalVotos);
}

function criarListaVotos(usuario, stats, votosDados, filmes) {
    const lista = form.lista();
    lista.innerHTML = '';

    const liAdicionados = criarItemLista({ valor: 0, descricao: 'Adicionados', total: stats.userStats.totalMoviesAdded, iconClass: 'fa-solid fa-film' });
    liAdicionados.classList.add('ativo'); // Marca como ativo
    lista.appendChild(liAdicionados);

    votosDados.votes.forEach(v => {
        lista.appendChild(criarItemLista({ valor: v.type.id, descricao: v.type.description, total: v.totalVotes, emoji: v.type.emoji }));
    });

    lista.appendChild(criarItemLista({ valor: -1, descricao: 'Todos', total: stats.userStats.totalVotesGiven, iconClass: 'fa-solid fa-star' }));

    criarCardsFilmes(true, usuario, 0, filmes);
}

function criarItemLista({ valor, descricao, total, emoji = null, iconClass = null }) {
    const li = criarElemento('li');
    li.dataset.valor = valor;

    const spanIcone = criarElemento('span', ['icone']);
    if (emoji) spanIcone.textContent = emoji;
    else if (iconClass) {
        const i = criarElemento('i', iconClass.split(' '));
        spanIcone.appendChild(i);
    }

    const spanTexto = criarElemento('span', ['texto'], `${descricao} (${total})`);
    li.append(spanIcone, spanTexto);

    return li;
}

function selecionaItemLista(usuario, filmes) {
    const lista = form.lista();

    lista.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
            lista.querySelectorAll('li').forEach(item => item.classList.remove('ativo'));
            li.classList.add('ativo');

            const valor = parseInt(li.dataset.valor);
            const filmesUsuario = valor === 0;
            criarCardsFilmes(filmesUsuario, usuario, valor, filmes);

            lista.classList.remove('mostrar');
        }
    });
}

function filtrarFilmes(filmes, usuario, votoId, filmesUsuario) {
    return filmes.filter(filme => {
        if (filmesUsuario) return filme.chooser.discordId === usuario.discordId;
        return filme.votes.some(v =>
            v.voter.discordId === usuario.discordId &&
            (votoId === 0 || votoId === -1 || v.vote.id === votoId)
        );
    });
}

function criarCardsFilmes(filmesUsuario, usuario, votoId, filmes) {
    const container = form.divPai();

    container.classList.remove('borda-padrao', 'mensagem');
    container.innerHTML = '';

    const filmesFiltrados = filtrarFilmes(filmes, usuario, votoId, filmesUsuario);

    if (filmesFiltrados.length === 0) {
        container.classList.add('borda-padrao', 'mensagem');
        const mensagem = criarElemento('p', ['fonte-secundaria'], 'Nenhum filme adicionado ainda.');
        container.appendChild(mensagem);
    }

    const fragment = document.createDocumentFragment();
    filmesFiltrados.forEach(f => fragment.appendChild(criarFigure(f, usuario)));
    container.appendChild(fragment);
}

async function carregarPagina() {
    authService.requireLogin();

    const discordId = getQueryParam('id');
    const usuario = await usuarioService.getUsuarioById(discordId);
    const stats = await usuarioService.buscarStatisticasUsuario(usuario.discordId);
    const votosRecebidos = await usuarioService.buscarStatisticasVotosRecebidosUsuario(usuario.discordId);
    const votosDados = await usuarioService.buscarStatisticasVotosDadosUsuario(usuario.discordId);
    const filmes = await filmeService.buscarFilmes();

    criarPainelPerfilUsuario(usuario, stats, votosRecebidos, votosDados);
    criarListaVotos(usuario, stats, votosDados, filmes.movies);
    selecionaItemLista(usuario, filmes.movies);
}

function configurarMenuMobile() {
    const menuToggle = document.querySelector('#menu-toggle');
    const listaMobile = document.querySelector('#lista');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        listaMobile.classList.toggle('mostrar');
    });

    document.addEventListener('click', (e) => {
        if (!listaMobile.contains(e.target) && !menuToggle.contains(e.target)) {
            listaMobile.classList.remove('mostrar');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    try {
        await carregarPagina();
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao carregar dados da aplicação.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
        }
    } finally {
        if (container) container.classList.remove('inativo-js');  
        if (loader) loader.style.display = 'none';
    }

    configurarMenuMobile();
});