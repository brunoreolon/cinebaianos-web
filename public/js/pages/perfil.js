import { requireLogin } from '../auth.js';
import { getQueryParam, form, criarElemento, criarFigure, formatarData } from '../global.js';
import { getUsuarioById } from '../services/usuario-service.js';
import { buscarFilmes } from '../services/filme-service.js';
import { buscarTiposVotos, buscarVotosRecebidosUsuario } from '../services/voto-service.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

async function criarPainelPerfilUsuario(usuario, filmes, votos) {
    criarPainelDadosUsuario(usuario);
    criarPainelInformacoesVotosRecebidos(usuario, filmes, votos);
    criarPainelInformacoesVotosDoUsuarioNosFilmes(usuario, filmes, votos);
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

function criarTotalAdicionado(totalFilmesAdicionados, descricao) {
    const divPai = criarElemento('div');

    const divFilho = criarElemento('div', ['flex', 'align-center']);
    divFilho.style.marginTop = '5px';
    divFilho.style.marginBottom = '10px';
    
    const icone = criarElemento('i', ['fa-solid', 'fa-film', 'grande']);

    const quantidade = criarElemento('p', ['grande', 'sem-margin'], totalFilmesAdicionados.toString());
    const desc = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    divFilho.append(icone, quantidade);
    divPai.append(divFilho, desc);

    return divPai;
}

function criarTotalPorVoto(emoji, totalVotosRecebidosPorVoto, descricao) {
    const divPai = criarElemento('div', ['box']);

    const divFilho = criarElemento('div', ['flex', 'align-center']);
    const icone = criarElemento('i', ['grande'], emoji);

    const quantidade = criarElemento('p', ['grande', 'sem-margin'], totalVotosRecebidosPorVoto.toString());
    const desc = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    divFilho.append(icone, quantidade);
    divPai.append(divFilho, desc);

    return divPai;
}

function criarTotalVotos(totalVotosRecebidos, descricao) {
    const divPai = criarElemento('div');

    const divFilho = criarElemento('div', ['flex', 'align-center']);
    divFilho.style.marginTop = '5px';
    divFilho.style.marginBottom = '10px';
    
    const quantidade = criarElemento('p', ['grande', 'sem-margin'], totalVotosRecebidos.toString());
    const desc = criarElemento('p', ['fonte-secundaria', 'sem-margin'], descricao);

    divFilho.append(quantidade);
    divPai.append(divFilho, desc);

    return divPai;
}

async function criarPainelInformacoesVotosRecebidos(usuario, filmes, votos) {
    const votosRecebidos = await buscarVotosRecebidosUsuario(usuario.discordId);
    const divDadosVotos = form.dadosVotos();

    votosRecebidos.votes.forEach(v => {
        let total = v.totalVotes;
        let emoji = v.type.emoji;
        let descricao = v.type.description;
        
        const dados = criarTotalPorVoto(emoji, total, descricao);

        divDadosVotos.appendChild(dados);
    });
}

async function criarPainelInformacoesVotosDoUsuarioNosFilmes(usuario, filmes, votos) {
    const divDadosFilmes = form.dadosFilmes();

    const totalFilmesAdicionados = totalFilmesDoUsario(usuario.discordId, filmes);
    const totalAdicionados = criarTotalAdicionado(totalFilmesAdicionados, 'Adicionados');

    divDadosFilmes.appendChild(totalAdicionados);

    let totalVotosRecebidos = 0;
    votos.forEach(v => {
        let totalVotosRecebidosPorVoto = contarVotosRecebidosPorTipo(usuario.discordId, v.id, filmes);
        totalVotosRecebidos += totalVotosRecebidosPorVoto;
        const dados = criarTotalPorVoto(v.emoji, totalVotosRecebidosPorVoto, v.description);

        divDadosFilmes.appendChild(dados);
    });

    const totalVotos = criarTotalVotos(totalVotosRecebidos, 'Total de Votos');
    divDadosFilmes.appendChild(totalVotos);
}

function contarVotosRecebidosPorTipo(discordId, votoId, filmes) {
    return filmes.reduce((total, filme) => {
        const votosDoUsuario = filme.votes.filter(v => 
            v.voter.discordId === discordId &&
            v.vote.id === votoId
        );

        return total + votosDoUsuario.length;
    }, 0);
}

function totalFilmesDoUsario(discordId, filmesLista) {
    const filmes = filmesLista.filter(filme => {
        return filme.chooser.discordId === discordId;
    });

    return filmes.length;
}

function contarTodosVotosRecebidos(discordId, filmes) {
    return filmes.reduce((total, f) => {
        const votouNoFilme = f.votes.some(v => v.voter.discordId === discordId);
        return total + (votouNoFilme ? 1 : 0);
    }, 0);
}

async function criarListaVotos(usuario, filmes, votos) {
    const lista = form.lista();
    

    const liAdicionados = adicionarItem(true, usuario.discordId, 0, 'Adicionados', filmes);
    liAdicionados.classList.add('ativo')
    lista.appendChild(liAdicionados);

    votos.forEach(v =>{
        const li = adicionarItem(false, usuario.discordId, v.id, v.description, filmes, votos);
        lista.appendChild(li);
    });

    const liTodos = adicionarItem(false, usuario.discordId, -1, 'Todos', filmes);
    lista.appendChild(liTodos);

    criarCardsFilmes(true, usuario, 0, filmes);
}

function adicionarItem(filmesUsuario, discordId, votoId, descricao, filmes, votos = null) {
    let total = 0;
    if (filmesUsuario) {
        total = totalFilmesDoUsario(discordId, filmes);
    } else if (votoId === -1) {
        total = contarTodosVotosRecebidos(discordId, filmes);
    } else {
        total = contarVotosRecebidosPorTipo(discordId, votoId, filmes);
    }

    const descricaoCompleta = descricao + " (" + total + ")";

    const li = criarElemento('li');
    li.dataset.valor = votoId;

    const spanIcone = criarElemento('span', ['icone']);
    
    // Se for FontAwesome (Adicionados / Todos)
    if (filmesUsuario) {
        const i = criarElemento('i', ['fa-solid', 'fa-film']);
        spanIcone.appendChild(i);
    } else if (votoId === -1) {
        const i = criarElemento('i', ['fa-solid', 'fa-layer-group']); // Exemplo de ícone FA
        spanIcone.appendChild(i);
    } else {
        // Se for Emoji (Votos)
        const voto = votos.find(v => v.id === votoId);
        spanIcone.textContent = voto ? voto.emoji : '';
    }

    const spanTexto = criarElemento('span', ['texto'], descricaoCompleta);

    // DICA: Coloque o ícone ANTES do texto se quiser o padrão visual comum
    li.append(spanIcone, spanTexto); 

    return li;
}

function selecionaItemLista(usuario, filmes) {
    const lista = form.lista();

    lista.addEventListener('click', (e) => {
        const li = e.target.closest('li'); // Garante que pegamos o LI mesmo clicando no span
        if (li) {
            lista.querySelectorAll('li').forEach(item => item.classList.remove('ativo'));
            li.classList.add('ativo');

            const valor = parseInt(li.dataset.valor);
            const filmesUsuario = valor === 0;
            criarCardsFilmes(filmesUsuario, usuario, valor, filmes);

            // CORREÇÃO: Fecha a lista após selecionar um item no mobile
            lista.classList.remove('mostrar');
        }
    });
}

function criarCardsFilmes(filmesUsuario, usuario, votoId, filmes) {
    const divPai = form.divPai();

    divPai.classList.remove('borda-padrao', 'mensagem');
    divPai.innerHTML = '';

    const filmesFiltrados = filmes.filter(filme => {
        if (filmesUsuario) {
            return filme.chooser.discordId === usuario.discordId;
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
        const figure = criarFigure(f, usuario);
        divPai.appendChild(figure);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        requireLogin();

        const discordId = getQueryParam('id');
        const usuario = await getUsuarioById(discordId);
        const filmes = await buscarFilmes();
        const votos = await buscarTiposVotos();

        criarPainelPerfilUsuario(usuario, filmes.movies , votos);
        criarListaVotos(usuario, filmes.movies, votos);
        selecionaItemLista(usuario, filmes.movies);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao carregar dados da aplicação.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
        }
    }

    const menuToggle = document.querySelector('#menu-toggle');
    const listaMobile = document.querySelector('#lista');

    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que o clique propague
        listaMobile.classList.toggle('mostrar');
    });

    // Fecha o menu se clicar em qualquer lugar da tela (melhor experiência)
    document.addEventListener('click', (e) => {
        if (!listaMobile.contains(e.target) && !menuToggle.contains(e.target)) {
            listaMobile.classList.remove('mostrar');
        }
    });
});