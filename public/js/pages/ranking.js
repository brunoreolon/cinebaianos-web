import { authService } from '../services/auth-service.js';
import { votoService } from '../services/voto-service.js';
import { usuarioService } from '../services/usuario-service.js';
import { groupService } from '../services/group-service.js';
import { getCurrentGroup, loadCurrentGroup } from '../services/group-context.js';
import { criarElemento } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

async function criarFiltroVotos(votos, usuarioLogado, grupoSelecionado) {
    const divFiltro = document.querySelector('.filtro-ordem .filtros');
    divFiltro.innerHTML = '';
    votos.forEach((v, index) => {
        const classes = ['filtro', 'btn', 'btn-outline-primary'];
        if (index === 0) classes.push('ativo');
        const botaoVoto = criarElemento('button', classes, '');
        botaoVoto.style.marginRight = '8px';
        const icone = criarElemento('i', [], v.emoji);
        const texto = criarElemento('span', [], v.description);
        botaoVoto.append(icone, texto);
        botaoVoto.style.backgroundColor = v.color + '22';
        botaoVoto.style.borderColor = v.color;
        botaoVoto.dataset.color = v.color;
        const containerMain = document.querySelector('.cards');
        botaoVoto.addEventListener('click', () => {
            document.querySelectorAll('.filtro-ordem .filtro').forEach(btn => btn.classList.remove('ativo'));
            botaoVoto.classList.add('ativo');
            criarResumoVencedores(grupoSelecionado); // Mantém o resumo visível ao filtrar
            containerMain.innerHTML = '';
            criarCardRanking(v, usuarioLogado, grupoSelecionado);
        });
        botaoVoto.addEventListener('mouseenter', () => {
            botaoVoto.style.filter = 'brightness(85%)';
        });
        botaoVoto.addEventListener('mouseleave', () => {
            botaoVoto.style.filter = 'brightness(100%)';
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

async function criarCardRanking(votoSelecionado, usuarioLogado, grupoSelecionado) {
    const containerMain = document.querySelector('.cards');
    containerMain.innerHTML = '';
    if (!grupoSelecionado) {
        containerMain.innerHTML = '<div class="mensagem-sem-grupo">Selecione um grupo para visualizar o ranking.</div>';
        return;
    }
    let usuariosStatsVotosRecebidos = [];
    try {
        usuariosStatsVotosRecebidos = await votoService.buscarStatisticasVotosRecebidosUsuariosPorGrupo(grupoSelecionado.id);
    } catch (e) {
        containerMain.innerHTML = '<div class="mensagem-erro">Erro ao buscar ranking do grupo.</div>';
        return;
    }
    if (!usuariosStatsVotosRecebidos || usuariosStatsVotosRecebidos.length === 0) {
        containerMain.innerHTML = '<div class="mensagem-sem-usuarios">Nenhum usuário recebeu votos neste grupo.</div>';
        return;
    }
    const usuariosOrdenados = ordenarUsuariosPorVoto(usuariosStatsVotosRecebidos, votoSelecionado);
    for (const [index, usuarioStatsVotos] of usuariosOrdenados.entries()) {
        const posicaoRanking = index + 1;
        const usuario = usuarioStatsVotos.user;
        const usuarioVotos = usuarioStatsVotos.votes;
        // Busca estatísticas usando o id do banco e filtrando pelo grupo selecionado
        const usuarioStats = await usuarioService.buscarStatisticasUsuario(usuario.id, grupoSelecionado.id);
        const classesContainerCardRanking = ['card-ranking'];
        // Comparação para destacar o usuário logado
        const voce = usuario.id === usuarioLogado.id;
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
        const vv = usuarioVotos.find(v => v.type.id === votoSelecionado.id);
        const valor = criarElemento('div', [], vv ? vv.totalVotes.toString() : '0');
        const descricao = criarElemento('p', ['fonte-secundaria'], vv ? vv.type.description : '');
        containerInfo.append(valor, descricao);
        parte1.append(posicao, containerAvatar, containerUsuarioInfo, containerInfo);
        const separator = criarElemento('div', ['separador']);
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
    }
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

async function criarResumoVencedores(grupoSelecionado) {
    const containerMain = document.querySelector('.cards');
    const resumoAntigo = document.querySelector('.resumo-vencedores');
    if (resumoAntigo) resumoAntigo.remove();
    if (!grupoSelecionado) return;
    const votos = await votoService.buscarTiposVotos();
    let usuariosStatsVotosRecebidos = [];
    try {
        usuariosStatsVotosRecebidos = await votoService.buscarStatisticasVotosRecebidosUsuariosPorGrupo(grupoSelecionado.id);
    } catch (e) {
        return;
    }
    const resumoContainer = criarElemento('div', ['resumo-vencedores']);
    votos.forEach(voto => {
        const usuariosOrdenados = ordenarUsuariosPorVoto(usuariosStatsVotosRecebidos, voto);
        const vencedor = usuariosOrdenados[0];
        if (!vencedor) return;
        const totalVotos = vencedor.votes.find(v => v.type.id === voto.id)?.totalVotes ?? 0;
        const itemResumo = criarElemento('div', ['resumo-item']);
        const emoji = criarElemento('i', [], voto.emoji);
        const texto = criarElemento('span', [], `${vencedor.user.name} (${totalVotos} votos)`);
        itemResumo.append(emoji, texto);
        resumoContainer.appendChild(itemResumo);
    });
    containerMain.prepend(resumoContainer);
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
    try {
        authService.requireLogin();
        const usuarioLogado = await authService.getUsuarioLogado();
        if (!usuarioLogado) window.location.href = "./login.html";
        // Carregar grupos do usuário
        const meusGrupos = await groupService.buscarMeusGrupos();
        let grupoSelecionado = getCurrentGroup();
        if (!grupoSelecionado && meusGrupos.length > 0) {
            grupoSelecionado = meusGrupos[0];
        }
        // Criar dropdown de grupos
        criarDropdownGrupos(meusGrupos, grupoSelecionado, async (novoGrupo) => {
            grupoSelecionado = novoGrupo;
            const votos = await votoService.buscarTiposVotos();
            criarFiltroVotos(votos, usuarioLogado, grupoSelecionado);
            criarResumoVencedores(grupoSelecionado);
            criarCardRanking(votos[0], usuarioLogado, grupoSelecionado);
        });
        const votos = await votoService.buscarTiposVotos();
        criarFiltroVotos(votos, usuarioLogado, grupoSelecionado);
        criarResumoVencedores(grupoSelecionado);
        criarCardRanking(votos[0], usuarioLogado, grupoSelecionado);
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

// Cria o dropdown de grupos no topo da tela de ranking

function criarDropdownGrupos(grupos, grupoSelecionado, onChange) {
    let container = document.querySelector('.container-dropdown-grupos');
    if (!container) {
        container = document.createElement('div');
        container.className = 'container-dropdown-grupos card';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'flex-start';
        container.style.padding = '18px 24px';
        container.style.margin = '24px 0 18px 0';
        container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
        container.style.borderRadius = '12px';
        const main = document.querySelector('main') || document.body;
        main.insertBefore(container, main.firstChild);
    }
    container.innerHTML = '';
    const label = document.createElement('label');
    label.textContent = 'Grupo:';
    label.setAttribute('for', 'dropdown-grupos');
    label.style.marginRight = '12px';
    label.style.fontWeight = 'bold';
    label.style.fontSize = '1.1rem';
    const select = document.createElement('select');
    select.id = 'dropdown-grupos';
    select.className = 'form-select';
    select.style.minWidth = '220px';
    select.style.maxWidth = '350px';
    select.style.padding = '8px 16px';
    select.style.fontSize = '1.08rem';
    select.style.borderRadius = '8px';
    select.style.border = '1px solid #b0b0b0';
    select.style.background = '#fff';
    select.style.marginRight = '16px';
    grupos.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo.id;
        option.textContent = grupo.name;
        if (grupoSelecionado && grupo.id === grupoSelecionado.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    select.addEventListener('change', async (e) => {
        const novoGrupo = grupos.find(g => g.id == e.target.value);
        if (novoGrupo && typeof onChange === 'function') {
            await onChange(novoGrupo);
        }
    });
    container.appendChild(label);
    container.appendChild(select);
}
