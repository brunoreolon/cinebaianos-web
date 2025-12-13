import { requireLogin, getUsuarioLogado } from '../auth.js';
import { buscarFilmes, buscarFilmesAguardandoAvaliacao, buscarFilmesPorTitulo, adicionarFilme } from '../services/filme-service.js';
import { criarFigure, criarElemento, form } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

function criarCardsRecentes() {
    const divPai = form.filmesRecentes();

    filmes.forEach(f => {
        const figure = criarFigure(f, usuario);
        divPai.appendChild(figure);
    });
}

function criarCardsAguardandoAvaliacao(usuario, filmes) {
    const divPai = form.aguardandoAvaliacao();

    filmes.forEach(f => {
        const figure = criarFigure(f, usuario);
        divPai.appendChild(figure, usuario.discordId);
    });
}

function criarCardsTodos(usuario, filmes) {
    const divPai = form.todos();

    filmes.forEach(f => {
        const figure = criarFigure(f, usuario);
        divPai.appendChild(figure);
    });
}

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

    // Função de pesquisa
    async function pesquisarFilmes() {
        listaFilmes.innerHTML = "";
        const pesquisa = titulo.value.trim().toLowerCase();
        if (!pesquisa) return;

        try {
            const resultados = await buscarFilmesPorTitulo(pesquisa);

            dica.style.display = "none";
            containerFilmesEncontrados.style.display = "block";
            renderizarFilmes(resultados, listaFilmes, modal)
        } catch (err) {
            containerFilmesEncontrados.style.display = "block";
            dica.style.display = "none";
            listaFilmes.innerHTML = "";

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

    titulo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            pesquisarFilmes();
        }
    });

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function renderizarFilmes(filmes, listaFilmes, modal) {
    if (filmes.length === 0) {
        containerFilmesEncontrados.style.display = "none";
        return;
    }

    filmes.forEach(movie => {
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
                const usuario = await getUsuarioLogado();
                if (!usuario) {
                    window.location.href = "./login.html";
                    return;
                }

                const filmeAdicionado = await adicionarFilme(movie.id, usuario.discordId);

                fecharModal(modal); 

                criarMensagem(`Filme "${filmeAdicionado.title}" adicionado com sucesso!`, MensagemTipo.SUCCESS);
                criarMensagem(`Filme "${filmeAdicionado.title}" está aguardando sua avaliação.`, MensagemTipo.ALERT);
                
                const aguardandoAvaliacao = form.aguardandoAvaliacao();
                const todos = form.todos();

                aguardandoAvaliacao.prepend(criarFigure(filmeAdicionado, usuario));
                todos.prepend(criarFigure(filmeAdicionado, usuario));
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

}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300); 
}

document.addEventListener('DOMContentLoaded', async () => {
    const flash = sessionStorage.getItem("flashMessage");

    if (flash) {
        const { texto, tipo } = JSON.parse(flash);
        criarMensagem(texto, MensagemTipo[tipo]);
        sessionStorage.removeItem("flashMessage");
    }

    try {
        requireLogin();

        const usuario = await getUsuarioLogado();
        if (!usuario) {
            window.location.href = "./login.html";
            return;
        }

        const filmesAguardandoAvaliacao =
            await buscarFilmesAguardandoAvaliacao({ discordId: usuario.discordId });

        const filmes = await buscarFilmes();

        criarCardsAguardandoAvaliacao(usuario, filmesAguardandoAvaliacao);
        criarCardsTodos(usuario, filmes);

        const btnPesquisar = document.querySelector(".adicionar");
        btnPesquisar.addEventListener('click', abrirModalNovoFilme);
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(
                err.detail || "Erro ao carregar dados da aplicação.", MensagemTipo.ERROR);
        } else {
            criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
        }
    }
});