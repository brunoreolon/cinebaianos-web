import { authService } from '../services/auth-service.js';
import { filmeService } from '../services/filme-service.js';
import { ensureCurrentGroup } from '../services/group-context.js';
import { votoService } from '../services/voto-service.js';
import { criarFigure, criarElemento, form, ordenarUsuariosPorNome } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

let filmesDoGrupo = [];
let grupoAtualId = null;
let grupoAtualContexto = null;
let grupoMovieNewDays = null;
let usuarioLogado = null;

function criarEstadoVazioCatalogo(titulo, descricao) {
    const empty = document.createElement('div');
    empty.className = 'catalog-empty-state';
    empty.innerHTML = `
        <i class="fa-regular fa-folder-open"></i>
        <strong>${titulo}</strong>
        <span>${descricao}</span>
    `;
    return empty;
}

function renderizarSkeletonCards(container, count = 8) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('article');
        skeleton.className = 'card-skeleton';
        container.appendChild(skeleton);
    }
}

function atualizarGridComTransicao(container, renderFn) {
    if (!container) {
        renderFn();
        return;
    }

    container.classList.add('catalog-grid-updating');
    requestAnimationFrame(() => {
        renderFn();
        requestAnimationFrame(() => {
            container.classList.remove('catalog-grid-updating');
        });
    });
}

function criarCardFilmeComContextoGrupo(filme, usuario) {
    return criarFigure(filme, usuario, {
        movieNewDays: grupoMovieNewDays,
        groupId: grupoAtualId
    });
}

function parseMovieNewDays(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

// Debounce util
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ====================== SEÇÃO "AGUARDANDO AVALIAÇÃO" ======================
function criarCardsAguardandoAvaliacao(usuario, filmes) {
    const divPai = form.aguardandoAvaliacao();
    divPai.innerHTML = '';

    if (!filmes || filmes.length === 0) {
        const estadoVazio = criarEstadoVazioCatalogo(
            'Nenhum filme aguardando avaliação',
            'Quando você tiver filmes sem voto no grupo atual, eles aparecerão aqui.'
        );
        estadoVazio.classList.add('sem-filmes-ag-avaliacao');
        divPai.appendChild(estadoVazio);
        return;
    }

    filmes.forEach(f => divPai.appendChild(criarCardFilmeComContextoGrupo(f, usuario)));
}

function obterFilmesAguardandoAvaliacao(filmes, usuario) {
    return filmes.filter(f => !f.votes.some(v => Number(v?.voter?.id) === Number(usuario.id)));
}

// ====================== SEÇÃO "TODOS OS FILMES" ======================
function criarCardsTodos(filmes) {
    const divPai = form.todos();
    divPai.innerHTML = '';

    if (!filmes || filmes.length === 0) {
        divPai.appendChild(criarEstadoVazioCatalogo(
            'Nenhum filme encontrado',
            'Tente ajustar os filtros para visualizar outros filmes do grupo.'
        ));
        return;
    }

    filmes.forEach(f => divPai.appendChild(criarCardFilmeComContextoGrupo(f, usuarioLogado)));
}

// ====================== FILTROS "TODOS OS FILMES" (client-side) ======================
function filtrarEOrdenarFilmes() {
    const ordenarPor = document.querySelector('#ordenar-por')?.value || 'dateAdded';
    const ordenarDirecao = document.querySelector('#ordenar-direcao')?.dataset.direction || 'desc';
    const filtroUsuario = document.querySelector('#filtro-usuario')?.value;
    const filtroVoto = document.querySelector('#filtro-voto')?.value;
    const filtroGenero = document.querySelector('#filtro-genero')?.value;
    const buscarTitulo = document.querySelector('#buscar-titulo')?.value.trim();

    let filmes = [...filmesDoGrupo];

    if (filtroUsuario) filmes = filmes.filter(f => Number(f?.chooser?.id) === Number(filtroUsuario));
    if (filtroVoto) filmes = filmes.filter(f => f.votes.some(v => v.vote.id === Number(filtroVoto)));
    if (filtroGenero) filmes = filmes.filter(f => f.genres?.some(g => g.id === Number(filtroGenero)));
    if (buscarTitulo) filmes = filmes.filter(f => f.title.toLowerCase().includes(buscarTitulo.toLowerCase()));

    const dir = ordenarDirecao === 'asc' ? 1 : -1;
    filmes.sort((a, b) => {
        let comparison;
        if (ordenarPor === 'title') {
            comparison = a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
        } else if (ordenarPor === 'chooser.name') {
            comparison = (a.chooser?.name || '').localeCompare(b.chooser?.name || '', 'pt-BR', { sensitivity: 'base' });
        } else {
            // dateAdded
            comparison = new Date(a.dateAdded) - new Date(b.dateAdded);
        }
        return dir * comparison;
    });

    return filmes;
}

function atualizarResumoFiltros(totalResultados) {
    const el = document.getElementById('filtro-resultados');
    if (!el) return;

    const total = Number(totalResultados) || 0;
    el.textContent = `${total} ${total === 1 ? 'resultado' : 'resultados'}`;
}

function limparFiltros() {
    const ordenarPor = document.querySelector('#ordenar-por');
    const ordenarDirecao = document.querySelector('#ordenar-direcao');
    const textoDirecao = document.querySelector('#texto-direcao');
    const filtroUsuario = document.querySelector('#filtro-usuario');
    const filtroVoto = document.querySelector('#filtro-voto');
    const filtroGenero = document.querySelector('#filtro-genero');
    const filmesSize = document.querySelector('#filmes-size');
    const buscarTitulo = document.querySelector('#buscar-titulo');

    if (ordenarPor) ordenarPor.value = 'dateAdded';
    if (ordenarDirecao) ordenarDirecao.dataset.direction = 'desc';
    if (textoDirecao) textoDirecao.textContent = 'Z - A';
    if (filtroUsuario) filtroUsuario.value = '';
    if (filtroVoto) filtroVoto.value = '';
    if (filtroGenero) filtroGenero.value = '';
    if (filmesSize) filmesSize.value = '20';
    if (buscarTitulo) buscarTitulo.value = '';

    atualizarFilmes(0);
}

async function atualizarFilmes(page = 0) {
    const size = Number(document.querySelector('#filmes-size')?.value) || 20;
    const filmesFiltrados = filtrarEOrdenarFilmes();
    const totalPages = Math.ceil(filmesFiltrados.length / size);
    const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
    const inicio = currentPage * size;
    const filmesNaPagina = filmesFiltrados.slice(inicio, inicio + size);

    atualizarGridComTransicao(form.todos(), () => criarCardsTodos(filmesNaPagina));
    criarPaginacao(totalPages, currentPage);
    atualizarResumoFiltros(filmesFiltrados.length);
}

function criarPaginacao(totalPages, currentPage) {
    const container = document.querySelector('.paginacao');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
        const btn = criarElemento('button', ['btn-pagina'], i + 1);
        btn.disabled = i === currentPage;
        btn.onclick = () => atualizarFilmes(i);
        container.appendChild(btn);
    }
}

function popularFiltroUsuarios(filmes) {
    const filtroUsuarioSelect = document.querySelector('#filtro-usuario');
    if (!filtroUsuarioSelect) return;

    // Preserve valor selecionado
    const valorAtual = filtroUsuarioSelect.value;
    filtroUsuarioSelect.innerHTML = '<option value="">Todos</option>';

    const uniqueChooserMap = new Map();
    filmes.forEach(f => {
        if (f?.chooser?.id && !uniqueChooserMap.has(f.chooser.id)) {
            uniqueChooserMap.set(f.chooser.id, f.chooser);
        }
    });

    const usuarios = ordenarUsuariosPorNome([...uniqueChooserMap.values()]);
    usuarios.forEach(u => {
        const option = criarElemento('option', [], u.name);
        option.value = String(u.id);
        filtroUsuarioSelect.appendChild(option);
    });

    // Restaurar seleção anterior se ainda válida
    if (valorAtual) filtroUsuarioSelect.value = valorAtual;
}

// ====================== MODAL "NOVO FILME" ======================
async function abrirModalNovoFilme() {
    const modal = form.modalNovoFilme();
    modal.classList.remove("inativo");
    modal.classList.remove("fechando");
    modal.classList.add("ativo");

    const titulo = modal.querySelector("#titulo");
    const grupoDestino = modal.querySelector('#grupo-destino-modal');
    const btnPesquisar = modal.querySelector(".btn-pesquisar");
    const dica = modal.querySelector(".dica");
    const listaFilmes = modal.querySelector(".filmes-encontrados ul");
    const containerFilmesEncontrados = modal.querySelector(".filmes-encontrados");

    titulo.value = "";
    if (grupoDestino) {
        const nome = grupoAtualContexto?.name || 'Grupo atual';
        const tag = grupoAtualContexto?.tag ? `#${grupoAtualContexto.tag}` : null;
        grupoDestino.innerHTML = tag
            ? `Filme será adicionado em: <strong>${nome}</strong> (${tag})`
            : `Filme será adicionado em: <strong>${nome}</strong>`;
    }
    listaFilmes.innerHTML = "";
    dica.style.display = "flex";
    containerFilmesEncontrados.style.display = "none";

    async function pesquisarFilmes() {
        listaFilmes.innerHTML = "";
        const pesquisa = titulo.value.trim().toLowerCase();
        if (!pesquisa) return;

        try {
            const resultados = await filmeService.buscarFilmesPorTitulo(pesquisa);

            dica.style.display = "none";
            containerFilmesEncontrados.style.display = "block";

            resultados.forEach(movie => {
                const li = criarElemento('li', ['lista']);
                li.innerHTML = `
                    <div class="poster">
                        <img src="${movie.posterPath || './assets/img/placeholder-poster.png'}" 
                            alt="${movie.title}" width="64" height="95">
                    </div>
                    <div class="info-filme">
                        <div class="topo">
                            <div class="titulos">
                                <h3>${movie.title}</h3>
                                <p>${movie.releaseDate ? movie.releaseDate.split('-')[0] : "--/--/----"}</p>
                            </div>
                        </div>
                        <p class="sinopse">${movie.synopsis || "Sem sinopse disponível."}</p>
                    </div>
                `;

                li.style.cursor = "pointer";
                li.onclick = async () => {
                    try {
                        if (!usuarioLogado) {
                            window.location.href = "./login.html";
                            return;
                        }

                        const grupoAtualizado = await filmeService.adicionarFilmeAoGrupo(
                            grupoAtualId, movie.id, usuarioLogado.id
                        );

                        grupoMovieNewDays = parseMovieNewDays(grupoAtualizado?.movieNewDays ?? grupoMovieNewDays);

                        // Atualizar cache com os filmes retornados pelo grupo
                        filmesDoGrupo = grupoAtualizado.movies || [];

                        const textoAgAvaliacao = document.querySelector('.sem-filmes-ag-avaliacao');
                        textoAgAvaliacao?.remove();

                        fecharModal(modal);

                        // Encontrar o filme recém-adicionado pelo tmdbId
                        const filmeAdicionado = filmesDoGrupo.find(f => f.tmdbId === String(movie.id));

                        if (filmeAdicionado) {
                            criarMensagem(`Filme "${filmeAdicionado.title}" adicionado com sucesso!`, MensagemTipo.SUCCESS);
                            criarMensagem(`Filme "${filmeAdicionado.title}" está aguardando sua avaliação.`, MensagemTipo.ALERT);
                            form.aguardandoAvaliacao().prepend(criarCardFilmeComContextoGrupo(filmeAdicionado, usuarioLogado));
                        }

                        // Atualizar filtro de usuários e refresh da lista
                        popularFiltroUsuarios(filmesDoGrupo);
                        await atualizarFilmes();
                    } catch (err) {
                        if (err instanceof ApiError) {
                            criarMensagem(err.detail || "Erro ao adicionar filme.", MensagemTipo.ERROR);
                        } else {
                            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
                        }
                    }
                };

                listaFilmes.appendChild(li);
            });
        } catch (err) {
            containerFilmesEncontrados.style.display = "block";
            dica.style.display = "none";
            const msg = criarElemento('p', ['sem-filmes'],
                err instanceof ApiError && err.errorCode === 'movie_not_found'
                    ? `Nenhum filme encontrado com o título "${titulo.value}".`
                    : "Erro ao buscar filmes. Tente novamente."
            );
            msg.style.fontSize = "16px";
            msg.style.color = "var(--cor-branco-2)";
            msg.style.textAlign = "center";
            msg.style.margin = "20px 0";
            listaFilmes.appendChild(msg);
        }
    }

    btnPesquisar.onclick = pesquisarFilmes;
    titulo.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pesquisarFilmes(); } });

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function fecharModal(modal) {
    if (!modal || modal.classList.contains('fechando') || modal.classList.contains('inativo')) return;

    modal.classList.remove('ativo');
    modal.classList.add('fechando');

    setTimeout(() => {
        modal.classList.remove('fechando');
        modal.classList.add('inativo');
    }, 280);
}

// ====================== INICIALIZAÇÃO ======================
document.addEventListener('DOMContentLoaded', async () => {
    const flash = sessionStorage.getItem("flashMessage");
    if (flash) {
        const { texto, tipo } = JSON.parse(flash);
        criarMensagem(texto, MensagemTipo[tipo]);
        sessionStorage.removeItem("flashMessage");
    }

    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
    
    try {
        await authService.requireLogin();

        renderizarSkeletonCards(form.aguardandoAvaliacao(), 4);
        renderizarSkeletonCards(form.todos(), 10);

        usuarioLogado = await authService.getUsuarioLogado();
        if (!usuarioLogado) window.location.href = "./login.html";

        const grupoAtual = await ensureCurrentGroup({
            redirectIfMissing: true,
            redirectTo: './meus-grupos.html',
            message: 'Escolha ou entre em um grupo antes de navegar pelos filmes.'
        });

        if (!grupoAtual) return;

        grupoAtualContexto = grupoAtual;
        grupoAtualId = grupoAtual.id;

        // Buscar todos os filmes do grupo
        const grupoComFilmes = await filmeService.buscarFilmesDoGrupo(grupoAtualId);
        filmesDoGrupo = grupoComFilmes.movies || [];
        grupoMovieNewDays = parseMovieNewDays(grupoComFilmes?.movieNewDays ?? grupoAtualContexto?.movieNewDays);

        // Filmes aguardando avaliação (sem voto do usuário logado)
        const filmesAguardando = obterFilmesAguardandoAvaliacao(filmesDoGrupo, usuarioLogado);
        criarCardsAguardandoAvaliacao(usuarioLogado, filmesAguardando);

        // Eventos de filtro / ordenação
        document.querySelector('#ordenar-por')?.addEventListener('change', () => atualizarFilmes(0));

        const containerDirecao = document.querySelector('.ordenacao-direcao');
        const botaoDirecao = containerDirecao.querySelector('button'); 
        const textoDirecao = containerDirecao.querySelector('#texto-direcao');

        containerDirecao.addEventListener('click', () => {
            const novaDirecao = botaoDirecao.dataset.direction === 'asc' ? 'desc' : 'asc';
            botaoDirecao.dataset.direction = novaDirecao;
            textoDirecao.textContent = novaDirecao === 'asc' ? 'A - Z' : 'Z - A';

            containerDirecao.classList.add('ativo');
            setTimeout(() => containerDirecao.classList.remove('ativo'), 200);

            atualizarFilmes();
        });

        // Popular filtro de usuários a partir dos choosers dos filmes do grupo
        popularFiltroUsuarios(filmesDoGrupo);
        document.querySelector('#filtro-usuario')?.addEventListener('change', () => atualizarFilmes(0));

        // Popular filtro de votos
        const votos = await votoService.buscarTiposVotos();
        const filtroVotoSelect = document.querySelector('#filtro-voto');
        votos.forEach(v => {
            const option = criarElemento('option', [], v.description);
            option.value = v.id;
            filtroVotoSelect?.appendChild(option);
        });
        filtroVotoSelect?.addEventListener('change', () => atualizarFilmes(0));

        // Popular filtro de gêneros
        const generos = await filmeService.buscarGeneros();
        const filtroGeneroSelect = document.querySelector('#filtro-genero');
        generos.forEach(g => {
            const option = criarElemento('option', [], g.name);
            option.value = g.id;
            filtroGeneroSelect?.appendChild(option);
        });

        filtroGeneroSelect?.addEventListener('change', () => atualizarFilmes(0));

        const selectSize = document.querySelector('#filmes-size');
        selectSize.addEventListener('change', () => atualizarFilmes(0)); 

        const inputTitulo = document.querySelector('#buscar-titulo');
        inputTitulo?.addEventListener('input', debounce(() => atualizarFilmes(0)));

        document.querySelector('#limpar-filtros')?.addEventListener('click', limparFiltros);

        await atualizarFilmes();

        document.querySelector(".adicionar")?.addEventListener('click', abrirModalNovoFilme);
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