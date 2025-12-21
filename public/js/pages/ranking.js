import { authService } from '../services/auth-service.js';
import { votoService } from '../services/voto-service.js';
import { usuarioService } from '../services/usuario-service.js';
import { criarElemento } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

async function criarFiltroVotos(votos, usuarioLogado) {
    const divFiltro = document.querySelector('.filtro-ordem .filtros');

    votos.forEach((v, index) => {
        const classes = ['filtro'];

        if (index === 0) {
            classes.push('ativo');
        }

        const botaoVoto = criarElemento('button', classes, v.description);
        const containerMain = document.querySelector('.cards');
        botaoVoto.addEventListener('click', () => {
            document.querySelectorAll('.filtro-ordem .filtro').forEach(btn => btn.classList.remove('ativo'));
            botaoVoto.classList.add('ativo');

            containerMain.innerHTML = '';
            criarCardRanking(v, usuarioLogado);
        });

        divFiltro.appendChild(botaoVoto);
    });
}

function ordenarUsuariosPorVoto(usuariosStats, votoSelecionado) {
    return [...usuariosStats].sort((a, b) => {
        const votosA = a.votes.find(v => v.type.id === votoSelecionado.id)?.totalVotes ?? 0;
        const votosB = b.votes.find(v => v.type.id === votoSelecionado.id)?.totalVotes ?? 0;

        return votosB - votosA || a.user.name.localeCompare(b.user.name);
    });
}

async function criarCardRanking(votoSelecionado, usuarioLogado) {
    const usuariosStatsVotosRecebidos = await votoService.buscarStatisticasVotosRecebidosUsuarios();

    const usuariosOrdenados = ordenarUsuariosPorVoto(
        usuariosStatsVotosRecebidos,
        votoSelecionado
    );

    const containerMain = document.querySelector('.cards');

    for (const [index, usuarioStatsVotos] of usuariosOrdenados.entries()) {

        const posicaoRanking = index + 1;

        const usuario = usuarioStatsVotos.user;
        const usuarioVotos = usuarioStatsVotos.votes;

        const usuarioStats = await usuarioService.buscarStatisticasUsuario(usuario.discordId);

        const classesContainerCardRanking = ['card-ranking'];
        const voce = usuario.discordId === usuarioLogado.discordId;

        if (voce) {
            classesContainerCardRanking.push('voce');
        }

        const containerCardRanking = criarElemento('div', classesContainerCardRanking);

        const parte1 = criarElemento('div', ['parte-1']);

        const posicao = criarPosicaoRanking(posicaoRanking);

        const containerAvatar = criarElemento('div', ['usuario-avatar']);
        const avatar = criarElemento('img');
        avatar.src = usuario.avatar;
        avatar.alt = 'Avatar';
        containerAvatar.appendChild(avatar);

        const containerUsuarioInfo = criarElemento('div', ['usuario-info']);
        const containerUsuario = criarElemento('div', ['usuario']);
        const nomeUsuario = criarElemento('h3', [], usuario.name);
        if (voce) {
            const badgeVoce = criarElemento('span', ['badge-voce'], 'Você');
            containerUsuario.append(nomeUsuario, badgeVoce);
        } else {
            containerUsuario.appendChild(nomeUsuario);
        }

        const totalFilmesAdicionado = criarElemento('p', [], usuarioStats.userStats.totalMoviesAdded + ' filmes adicionados');
        containerUsuarioInfo.append(containerUsuario, totalFilmesAdicionado);
        
        const containerInfo = criarElemento('div', ['info']);

        // VALOR DINAMICO POR FILTRO SELECIONADO
        const vv = usuarioVotos.find(v => v.type.id === votoSelecionado.id);
        const valor = criarElemento('div', [], vv.totalVotes.toString());
        const descricao = criarElemento('p', ['fonte-secundaria'], vv.type.description);
        //
        containerInfo.append(valor, descricao);

        parte1.append(posicao, containerAvatar, containerUsuarioInfo, containerInfo);

        const separator = criarElemento('div', ['separator']);

        const contaienerVotos = criarElemento('div', ['votos']);
        usuarioVotos.forEach(v => {
            const contaienerVoto = criarElemento('div', ['voto']);

            const contaienerVotoInfo = criarElemento('div', ['voto-info']);
            const iconeVoto = criarElemento('i', [], v.type.emoji);
            const totalVotos = criarElemento('p', [], v.totalVotes.toString());
            contaienerVotoInfo.append(iconeVoto, totalVotos);

            const descricaoVoto = criarElemento('p', [], v.type.description);
            contaienerVoto.append(contaienerVotoInfo, descricaoVoto);
            
            contaienerVotos.appendChild(contaienerVoto);
        });

        containerCardRanking.append(parte1, separator, contaienerVotos);
        containerMain.appendChild(containerCardRanking);
    };
}

function criarPosicaoRanking(posicaoRanking) {
    let classes = ['posicao'];
    let elemento;

    if (posicaoRanking === 1) {
        classes.push('primeiro');
        elemento = criarElemento('i', ['fa-solid', 'fa-trophy', 'fa-2x']);
    }
    else if (posicaoRanking === 2) {
        classes.push('segundo');
        elemento = criarElemento('i', ['fa-solid', 'fa-medal', 'fa-2x']);
    }
    else if (posicaoRanking === 3) {
        classes.push('terceiro');
        elemento = criarElemento('i', ['fa-solid', 'fa-medal', 'fa-2x']);
    }
    else {
        classes.push('sem-medalha');
        elemento = criarElemento('span', [], `#${posicaoRanking}`);
    }

    const container = criarElemento('div', classes);
    container.appendChild(elemento);

    return container;
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    try {
        authService.requireLogin();

        const usuarioLogado = await authService.getUsuarioLogado();
        if (!usuarioLogado) window.location.href = "./login.html";

        const votos = await votoService.buscarTiposVotos();
        criarFiltroVotos(votos, usuarioLogado);
        criarCardRanking(votos[0], usuarioLogado);
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
});