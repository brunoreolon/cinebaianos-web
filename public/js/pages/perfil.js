import { authService } from '../services/auth-service.js';
import { usuarioService } from '../services/usuario-service.js';
import { filmeService } from '../services/filme-service.js';
import { votoService } from '../services/voto-service.js';
import { groupService } from '../services/group-service.js';
import { ensureCurrentGroup } from '../services/group-context.js';
import { getQueryParam, form, criarElemento, criarFigure, formatarData, formatMembershipStatusLabel } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

async function criarPainelPerfilUsuario(usuario, perfilStats, currentGroup, profileContext) {
    criarPainelDadosUsuario(usuario, currentGroup, profileContext);
    criarPainelInformacoesVotosRecebidos(perfilStats.votosRecebidos, currentGroup, profileContext);
    criarPainelInformacoesVotosDoUsuarioNosFilmes(perfilStats, profileContext);
}

function formatarDataSegura(dataValue, fallback = 'Data não disponível') {
    if (!dataValue) return fallback;
    const date = new Date(dataValue);
    if (Number.isNaN(date.getTime())) return fallback;
    return formatarData(dataValue);
}

function resolveDataContaCriada(usuario) {
    return usuario?.createdAt || usuario?.joined || usuario?.created || usuario?.joinedAt || null;
}

function criarPainelDadosUsuario(usuario, currentGroup, profileContext) {
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
    img.alt = `Avatar de ${usuario.name || 'usuário'}`;
    img.addEventListener('error', () => {
        img.src = './assets/img/placeholder-avatar.png';
    }, { once: true });
    divImagemPerfil.appendChild(img);

    // Informações do usuário
    const divInformacoes = criarElemento('div', ['dados']);

    const nome = criarElemento('p', ['fonte-primaria', 'grande', 'nome'], usuario.name);
    const biografia = criarElemento('p', ['fonte-secundaria', 'bio'], usuario.biography || "Sem biografia");

    const statusBanner = criarStatusGrupoBanner(usuario, currentGroup, profileContext);

    const contaCriadaDesde = criarLinhaIconeTexto(
        'fa-solid fa-id-badge',
        `Conta no CineBaianos desde: ${formatarDataSegura(resolveDataContaCriada(usuario))}`
    );

    if (profileContext.isMemberCurrentGroup && profileContext.joinedAtCurrentGroup) {
        const membroNoGrupoDesde = criarLinhaIconeTexto(
            'fa-solid fa-calendar',
            `No grupo desde: ${formatarDataSegura(profileContext.joinedAtCurrentGroup)}`
        );
        divInformacoes.append(nome, biografia, membroNoGrupoDesde, contaCriadaDesde);
    } else {
        divInformacoes.append(nome, biografia, contaCriadaDesde);
    }

    if (statusBanner) {
        divInformacoes.appendChild(statusBanner);
    }

    if (!profileContext.canSeeGroupData && !profileContext.isMemberCurrentGroup && currentGroup?.name) {
        const aviso = criarLinhaIconeTexto(
            'fa-solid fa-circle-info',
            `${usuario.name} não participa do grupo atual (${currentGroup.name}).`
        );
        divInformacoes.appendChild(aviso);
    }

    if (currentGroup?.name) {
        const contextoGrupo = criarLinhaIconeTexto('fa-solid fa-users', `Visualizando no grupo: ${currentGroup.name}`);
        divInformacoes.appendChild(contextoGrupo);
    }

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

function criarStatusGrupoBanner(usuario, currentGroup, profileContext) {
    if (!currentGroup?.name) return null;

    const status = profileContext?.membershipStatus || 'NOT_MEMBER';
    const statusLabel = status === 'ACTIVE'
        ? 'membro ativo'
        : (formatMembershipStatusLabel(status, profileContext?.banExpiresAt) || 'nao participa do grupo');

    const banner = criarElemento('div', ['perfil-status-banner']);
    if (status === 'ACTIVE') {
        banner.classList.add('is-active');
    } else if (status === 'LEFT') {
        banner.classList.add('is-left');
    } else if (status === 'BANNED_TEMPORARY') {
        banner.classList.add('is-banned-temp');
    } else if (status === 'BANNED_PERMANENT') {
        banner.classList.add('is-banned-perm');
    } else {
        banner.classList.add('is-not-member');
    }

    const iconClass = status === 'ACTIVE'
        ? 'fa-solid fa-circle-check'
        : status === 'LEFT'
            ? 'fa-solid fa-right-from-bracket'
            : status === 'BANNED_TEMPORARY' || status === 'BANNED_PERMANENT'
                ? 'fa-solid fa-ban'
                : 'fa-solid fa-user-slash';

    const icone = criarElemento('i', iconClass.split(' '));
    const texto = criarElemento('span', [], `${usuario?.name || 'Usuario'} no grupo ${currentGroup.name}: ${statusLabel}`);
    banner.append(icone, texto);

    return banner;
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

function criarPainelInformacoesVotosRecebidos(votosRecebidos, currentGroup, profileContext) {
    const divDadosVotos = form.dadosVotos();
    const subtitle = document.getElementById('votos-recebidos-contexto');
    if (subtitle) {
        if (!profileContext.canSeeGroupData) {
            subtitle.textContent = '(indisponível para usuários fora do grupo atual)';
        } else if (profileContext.isSelf) {
            subtitle.textContent = currentGroup?.name
                ? `(nos filmes que você adicionou em ${currentGroup.name})`
                : '(nos filmes que você adicionou)';
        } else {
            subtitle.textContent = currentGroup?.name
                ? `(nos filmes que ${profileContext.displayName} adicionou em ${currentGroup.name})`
                : `(nos filmes que ${profileContext.displayName} adicionou)`;
        }
    }

    divDadosVotos.innerHTML = '';

    for (const v of votosRecebidos) {
        let total = v.totalVotes;
        let emoji = v.type.emoji;
        let descricao = v.type.description;
        
        const dados = criarCard({ descricao: descricao, quantidade: total, emoji: emoji });

        divDadosVotos.appendChild(dados);
    }
}

function criarPainelInformacoesVotosDoUsuarioNosFilmes(perfilStats, profileContext) {
    const divDadosFilmes = form.dadosFilmes();
    divDadosFilmes.innerHTML = '';

    const totalAdicionados = criarCard({
        descricao: profileContext.isSelf ? 'Adicionados no grupo' : 'Adicionados por este usuário',
        quantidade: perfilStats.totalMoviesAdded,
        iconClass: ['fa-solid', 'fa-film'],
        iconGrande: true
    });
    divDadosFilmes.appendChild(totalAdicionados);

    perfilStats.votosDados.forEach(v => {
        const voto = v.type;
        const dados = criarCard({ descricao: voto.description, quantidade: v.totalVotes, emoji: voto.emoji });

        divDadosFilmes.appendChild(dados);
    });

    const totalVotos = criarCard({ descricao: 'Total de votos no grupo', quantidade: perfilStats.totalVotesGiven, iconClass: ['fa-solid', 'fa-star'], iconGrande: true });
    divDadosFilmes.appendChild(totalVotos);
}

function criarListaVotos(usuario, perfilStats, filmes, groupId) {
    const lista = form.lista();
    lista.innerHTML = '';

    const liAdicionados = criarItemLista({ valor: 0, descricao: 'Adicionados', total: perfilStats.totalMoviesAdded, iconClass: 'fa-solid fa-film' });
    liAdicionados.classList.add('ativo'); // Marca como ativo
    lista.appendChild(liAdicionados);

    perfilStats.votosDados.forEach(v => {
        lista.appendChild(criarItemLista({ valor: v.type.id, descricao: v.type.description, total: v.totalVotes, emoji: v.type.emoji }));
    });

    lista.appendChild(criarItemLista({ valor: -1, descricao: 'Todos', total: perfilStats.totalVotesGiven, iconClass: 'fa-solid fa-star' }));

    criarCardsFilmes(true, usuario, 0, filmes, groupId);
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

function selecionaItemLista(usuario, filmes, groupId) {
    const lista = form.lista();

    lista.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li) {
            lista.querySelectorAll('li').forEach(item => item.classList.remove('ativo'));
            li.classList.add('ativo');

            const valor = parseInt(li.dataset.valor);
            const filmesUsuario = valor === 0;
            criarCardsFilmes(filmesUsuario, usuario, valor, filmes, groupId);

            lista.classList.remove('mostrar');
        }
    });
}

function isSameUser(user, targetUser) {
    if (!user || !targetUser) return false;
    return Number(user.id) === Number(targetUser.id);
}

function getMembershipInfo(members, usuario) {
    const membership = (members || []).find(member =>
        member?.active !== false && isSameUser(member?.member, usuario)
    );

    return {
        isMember: Boolean(membership),
        joinedAt: membership?.joinedAt || null,
        role: membership?.role || null,
        membershipStatus: membership?.membershipStatus || (membership ? 'ACTIVE' : 'NOT_MEMBER'),
        banExpiresAt: membership?.banExpiresAt || null
    };
}

function isMemberByStatus(status) {
    return status === 'ACTIVE' || status === 'BANNED_TEMPORARY';
}

async function resolveMembershipInfo(groupId, members, usuario, permissions = null, isSelf = false) {
    const fallback = getMembershipInfo(members, usuario);
    const loggedUserIsMember = Boolean(permissions?.member);

    try {
        const member = await groupService.buscarMembroDoGrupo(groupId, usuario?.id);
        let membershipStatus = member?.membershipStatus || (member?.active === false ? 'LEFT' : 'ACTIVE');

        if (membershipStatus === 'NOT_MEMBER' && (fallback.isMember || (isSelf && loggedUserIsMember))) {
            membershipStatus = fallback.membershipStatus || 'ACTIVE';
        }

        return {
            isMember: isMemberByStatus(membershipStatus) || (isSelf && loggedUserIsMember),
            joinedAt: member?.joinedAt || fallback.joinedAt || null,
            role: member?.role || fallback.role || null,
            membershipStatus,
            banExpiresAt: member?.banExpiresAt || fallback.banExpiresAt || null
        };
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
            return {
                ...fallback,
                isMember: fallback.isMember || (isSelf && loggedUserIsMember),
                membershipStatus: fallback.membershipStatus || ((isSelf && loggedUserIsMember) ? 'ACTIVE' : 'NOT_MEMBER'),
                banExpiresAt: fallback.banExpiresAt || null
            };
        }

        return {
            ...fallback,
            isMember: fallback.isMember || (isSelf && loggedUserIsMember),
            membershipStatus: fallback.membershipStatus || ((isSelf && loggedUserIsMember) ? 'ACTIVE' : 'NOT_MEMBER'),
            banExpiresAt: fallback.banExpiresAt || null
        };
    }
}

function aplicarVisibilidadeConteudoGrupo(profileContext) {
    const votosRecebidos = document.getElementById('votos-recebidos');
    const dadosFilmesWrapper = document.getElementById('dados-filmes-wrapper');
    const abas = document.getElementById('abas');
    const filmes = document.getElementById('filmes');

    const displayValue = profileContext.canSeeGroupData ? '' : 'none';

    if (votosRecebidos) votosRecebidos.style.display = displayValue;
    if (dadosFilmesWrapper) dadosFilmesWrapper.style.display = displayValue;
    if (abas) abas.style.display = displayValue;
    if (filmes) filmes.style.display = displayValue;
}

function filtrarFilmes(filmes, usuario, votoId, filmesUsuario) {
    return filmes.filter(filme => {
        if (filmesUsuario) return isSameUser(filme.chooser, usuario);
        return filme.votes.some(v =>
            isSameUser(v.voter, usuario) &&
            (votoId === 0 || votoId === -1 || v.vote.id === votoId)
        );
    });
}

function criarCardsFilmes(filmesUsuario, usuario, votoId, filmes, groupId) {
    const container = form.divPai();

    container.classList.remove('borda-padrao', 'mensagem');
    container.innerHTML = '';

    const filmesFiltrados = filtrarFilmes(filmes, usuarioPerfil, votoId, filmesUsuario);

    if (filmesFiltrados.length === 0) {
        container.classList.add('borda-padrao', 'mensagem');
        const mensagem = criarElemento('p', ['fonte-secundaria'], filmesUsuario
            ? 'Nenhum filme adicionado por este usuário no grupo atual.'
            : 'Nenhum filme avaliado por este usuário com esse filtro no grupo atual.');
        container.appendChild(mensagem);
    }

    const fragment = document.createDocumentFragment();
    filmesFiltrados.forEach(f => fragment.appendChild(criarFigure(f, usuario, { groupId })));
    container.appendChild(fragment);
}

function buildVoteStats(voteTypes = []) {
    return voteTypes.map(voteType => ({
        type: voteType,
        totalVotes: 0
    }));
}

function incrementVote(stats, voteId) {
    const item = stats.find(v => Number(v.type?.id) === Number(voteId));
    if (item) {
        item.totalVotes += 1;
    }
}

function buildPerfilStats(usuario, movies, voteTypes) {
    const votosRecebidos = buildVoteStats(voteTypes);
    const votosDados = buildVoteStats(voteTypes);

    let totalMoviesAdded = 0;
    let totalVotesGiven = 0;

    movies.forEach(movie => {
        const addedByUser = isSameUser(movie?.chooser, usuario);
        if (addedByUser) {
            totalMoviesAdded += 1;
        }

        (movie?.votes || []).forEach(vote => {
            if (isSameUser(vote?.voter, usuario)) {
                totalVotesGiven += 1;
                incrementVote(votosDados, vote?.vote?.id);
            }

            if (addedByUser) {
                incrementVote(votosRecebidos, vote?.vote?.id);
            }
        });
    });

    return {
        totalMoviesAdded,
        totalVotesGiven,
        votosRecebidos,
        votosDados
    };
}

async function resolveUsuarioFromQuery(idParam) {
    const parsedId = Number(idParam);

    if (Number.isFinite(parsedId) && parsedId > 0) {
        return await usuarioService.getUsuarioById(parsedId);
    }

    throw new Error('Usuário não encontrado.');
}

async function carregarPagina() {
    await authService.requireLogin();

    const currentGroup = await ensureCurrentGroup({
        redirectIfMissing: true,
        redirectTo: './meus-grupos.html'
    });

    if (!currentGroup?.id) {
        return;
    }

    const idParam = getQueryParam('id');
    const [usuarioLogado, usuario, groupWithMovies, voteTypes, groupWithMembers, permissions] = await Promise.all([
        authService.getUsuarioLogado(),
        resolveUsuarioFromQuery(idParam),
        filmeService.buscarFilmesDoGrupo(currentGroup.id),
        votoService.buscarTiposVotosDisponiveis(currentGroup.id),
        groupService.buscarMembrosDoGrupo(currentGroup.id),
        groupService.buscarPermissoes(currentGroup.id)
    ]);

    const movies = groupWithMovies?.movies || [];
    const isSelf = isSameUser(usuario, usuarioLogado);
    const membershipInfo = await resolveMembershipInfo(
        currentGroup.id,
        groupWithMembers?.members || [],
        usuario,
        permissions,
        isSelf
    );
    const profileContext = {
        isSelf,
        displayName: usuario?.name || 'este usuário',
        isMemberCurrentGroup: membershipInfo.isMember,
        joinedAtCurrentGroup: membershipInfo.joinedAt,
        membershipStatus: membershipInfo.membershipStatus,
        banExpiresAt: membershipInfo.banExpiresAt,
        canSeeGroupData: isSelf || membershipInfo.isMember
    };

    aplicarVisibilidadeConteudoGrupo(profileContext);

    const perfilStats = profileContext.canSeeGroupData
        ? buildPerfilStats(usuario, movies, voteTypes || [])
        : buildPerfilStats(usuario, [], voteTypes || []);

    criarPainelPerfilUsuario(usuario, perfilStats, currentGroup, profileContext);

    if (profileContext.canSeeGroupData) {
        criarListaVotos(usuario, perfilStats, movies, currentGroup.id);
        selecionaItemLista(usuario, movies, currentGroup.id);
    }
}

function configurarMenuMobile() {
    const menuToggle = document.querySelector('#menu-toggle');
    const listaMobile = document.querySelector('#lista');

    if (!menuToggle || !listaMobile) return;

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
    if (loader) loader.style.display = 'flex';

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