import { requireLogin, getUsuarioLogado } from '../auth.js';
import { buscarFilmes, buscarFilmesAguardandoAvaliacao, buscarFilmesPorTitulo, adicionarFilme } from '../services/filme-service.js';
import { buscarUsuarios } from '../services/usuario-service.js';
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
        const p = criarElemento('p', ['fonte-secundaria'], 'Nenhum filme aguardando avaliação.');
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
async function atualizarFilmes() {
    const ordenarPor = document.querySelector('#ordenar-por')?.value;
    const ordenarDirecao = document.querySelector('#ordenar-direcao')?.value;
    const filtroUsuario = document.querySelector('#filtro-usuario')?.value;
    const buscarTitulo = document.querySelector('#buscar-titulo')?.value.trim();

    try {
        filmesTodos = await buscarFilmes({
            sortBy: ordenarPor || 'dateAdded',
            sortDir: ordenarDirecao || 'desc',
            discordId: filtroUsuario || null,
            title: buscarTitulo || null,
        });

        criarCardsTodos(filmesTodos);
    } catch (err) {
        criarCardsTodos([]);

        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao buscar filmes.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
        }
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
            const resultados = await buscarFilmesPorTitulo(pesquisa);

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

                        const filmeAdicionado = await adicionarFilme(movie.id, usuarioLogado.discordId);

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

    try {
        requireLogin();

        usuarioLogado = await getUsuarioLogado();
        if (!usuarioLogado) window.location.href = "./login.html";

        const filmesAguardandoAvaliacao = await buscarFilmesAguardandoAvaliacao({ discordId: usuarioLogado.discordId });
        const usuarios = ordenarUsuariosPorNome(await buscarUsuarios());

        criarCardsAguardandoAvaliacao(usuarioLogado, filmesAguardandoAvaliacao);

        // Popular filtro de usuários
        const filtroUsuarioSelect = document.querySelector('#filtro-usuario');
        usuarios.forEach(u => {
            const option = document.createElement('option');
            option.value = u.discordId;
            option.textContent = u.name;
            filtroUsuarioSelect?.appendChild(option);
        });

        // Eventos de filtro
        document.querySelector('#ordenar-por')?.addEventListener('change', atualizarFilmes);
        document.querySelector('#ordenar-direcao')?.addEventListener('change', atualizarFilmes);
        filtroUsuarioSelect?.addEventListener('change', atualizarFilmes);
        document.querySelector('#buscar-titulo')?.addEventListener('input', debounce(atualizarFilmes));

        await atualizarFilmes(); // render inicial já aplicando filtros da API

        document.querySelector(".adicionar")?.addEventListener('click', abrirModalNovoFilme);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao carregar dados da aplicação.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
        }
    }
});