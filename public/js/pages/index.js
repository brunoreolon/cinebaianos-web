import { authService } from '../services/auth-service.js';
import { filmeService } from '../services/filme-service.js';
import { usuarioService } from '../services/usuario-service.js';
import { votoService } from '../services/voto-service.js';
import { criarFigure, criarElemento, form, ordenarUsuariosPorNome } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

let filmesTodos = [];
let usuarioLogado = null;

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
        const p = criarElemento('p', ['fonte-secundaria', 'sem-filmes-ag-avaliacao'], 'Nenhum filme aguardando avaliação.');
        p.style.color = 'teal';
        divPai.appendChild(p);
        return;
    }

    filmes.forEach(f => divPai.appendChild(criarFigure(f, usuario)));
}

// ====================== SEÇÃO "TODOS OS FILMES" ======================
function criarCardsTodos(filmes) {
    const divPai = form.todos();
    divPai.innerHTML = '';

    if (!filmes || filmes.length === 0) {
        const p = criarElemento('p', ['fonte-secundaria'], 'Nenhum filme encontrado.');
        p.style.color = 'teal';
        divPai.appendChild(p);
        return;
    }

    filmes.forEach(f => divPai.appendChild(criarFigure(f, usuarioLogado)));
}

// ====================== FILTROS "TODOS OS FILMES" ======================
async function atualizarFilmes(page = 0) {
    const ordenarPor = document.querySelector('#ordenar-por')?.value;
    const ordenarDirecao = document.querySelector('#ordenar-direcao')?.dataset.direction;
    const filtroUsuario = document.querySelector('#filtro-usuario')?.value;
    const filtroVoto = document.querySelector('#filtro-voto')?.value;
    const filtroGenero = document.querySelector('#filtro-genero')?.value;
    const buscarTitulo = document.querySelector('#buscar-titulo')?.value.trim();
    const size = Number(document.querySelector('#filmes-size')?.value) || 20;

    try {
        const moviePage = await filmeService.buscarFilmes({
            page,
            size,
            sortBy: ordenarPor || 'dateAdded',
            sortDir: ordenarDirecao || 'desc',
            discordId: filtroUsuario || null,
            voteTypeId: filtroVoto ? Number(filtroVoto) : null,
            genreId: filtroGenero ? Number(filtroGenero) : null,
            title: buscarTitulo || null,
        });

        filmesTodos = moviePage.movies;
        criarCardsTodos(filmesTodos);

        criarPaginacao(moviePage.totalPages, page);
    } catch (err) {
        criarCardsTodos([]);
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao buscar filmes.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
        }
    }
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

// ====================== MODAL "NOVO FILME" ======================
async function abrirModalNovoFilme() {
    const modal = form.modalNovoFilme();
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    const titulo = modal.querySelector("#titulo");
    const btnPesquisar = modal.querySelector(".btn-pesquisar");
    const dica = modal.querySelector(".dica");
    const listaFilmes = modal.querySelector(".filmes-encontrados ul");
    const containerFilmesEncontrados = modal.querySelector(".filmes-encontrados");

    titulo.value = "";
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

                        const filmeAdicionado = await filmeService.adicionarFilme(movie.id, usuarioLogado.discordId);

                        const textoAgAvaliacao = document.querySelector('.sem-filmes-ag-avaliacao');
                        textoAgAvaliacao?.remove();

                        fecharModal(modal);

                        criarMensagem(`Filme "${filmeAdicionado.title}" adicionado com sucesso!`, MensagemTipo.SUCCESS);
                        criarMensagem(`Filme "${filmeAdicionado.title}" está aguardando sua avaliação.`, MensagemTipo.ALERT);

                        form.aguardandoAvaliacao().prepend(criarFigure(filmeAdicionado, usuarioLogado));
                        form.todos().prepend(criarFigure(filmeAdicionado, usuarioLogado));
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
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300);
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

        usuarioLogado = await authService.getUsuarioLogado();
        if (!usuarioLogado) window.location.href = "./login.html";

        const filmesAguardandoAvaliacao = await filmeService.buscarFilmesAguardandoAvaliacao({ discordId: usuarioLogado.discordId });
        const usuarios = ordenarUsuariosPorNome(await usuarioService.buscarUsuarios());
        const votos = await votoService.buscarTiposVotos();
        const generos = await filmeService.buscarGeneros();

        criarCardsAguardandoAvaliacao(usuarioLogado, filmesAguardandoAvaliacao);

        // Eventos de filtro
        document.querySelector('#ordenar-por')?.addEventListener('change', () => atualizarFilmes(0));

        const containerDirecao = document.querySelector('.ordenacao-direcao');
        const botaoDirecao = containerDirecao.querySelector('button'); 
        const textoDirecao = containerDirecao.querySelector('#texto-direcao');

        containerDirecao.addEventListener('click', () => {
            // alterna a direção
            const novaDirecao = botaoDirecao.dataset.direction === 'asc' ? 'desc' : 'asc';
            botaoDirecao.dataset.direction = novaDirecao;
            textoDirecao.textContent = novaDirecao === 'asc' ? 'A - Z' : 'Z - A';

            // aplica efeito visual no container
            containerDirecao.classList.add('ativo');
            setTimeout(() => containerDirecao.classList.remove('ativo'), 200);

            // dispara a ordenação
            atualizarFilmes();
        });

        // Popular filtro de usuários
        const filtroUsuarioSelect = document.querySelector('#filtro-usuario');
        usuarios.forEach(u => {
            const option = criarElemento('option', [], u.name);
            option.value = u.discordId;
            filtroUsuarioSelect?.appendChild(option);
        });

        filtroUsuarioSelect?.addEventListener('change', () => atualizarFilmes(0));

        // Popular filtro de vots
        const filtroVotoSelect = document.querySelector('#filtro-voto');
        votos.forEach(v => {
            const option = criarElemento('option', [], v.description);
            option.value = v.id;
            filtroVotoSelect?.appendChild(option);
        });

        filtroVotoSelect?.addEventListener('change', () => atualizarFilmes(0));

        // Popular filtro de generos
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