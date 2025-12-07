import { requireLogin, getUsuarioLogado } from '../auth.js';
import { buscarFilmes, buscarFilmesAguardandoAvaliacao, buscarFilmesPorTitulo, adicionarFilme } from '../services/filme-service.js';
import { criarFigure, criarElemento, form } from '../global.js';

function criarCardsRecentes() {
    const divPai = document.querySelector('.recentes .inline');

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
    const modal = document.getElementById('modal-novo-filme');
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

    btnPesquisar.onclick = async () => {
        listaFilmes.innerHTML = "";

        const pesquisa = titulo.value.toLowerCase();
        if (!pesquisa) return;

        const resultados = await buscarFilmesPorTitulo(pesquisa);

        if (resultados.length > 0) {
            dica.style.display = "none";
            renderizarFilmes(resultados, listaFilmes, modal);
            containerFilmesEncontrados.style.display = "block";
        } else {
            containerFilmesEncontrados.style.display = "none";
        }
    };

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
                        <p>${movie.releaseDate.split('-')[0]}</p>
                    </div>
                </div>

                <p class="sinopse">${movie.synopsis || "Sem sinopse disponível."}</p>
            </div>
        `;

        li.style.cursor = "pointer";
        li.onclick = async () => {
            const usuario = await getUsuarioLogado();
            const filmeAdicionado = await adicionarFilme(movie.id, usuario.discordId);
            fecharModal(modal); 

            if (filmeAdicionado) {
                const aguardandoAvaliacao = form.aguardandoAvaliacao();
                const todos = form.todos();
                
                aguardandoAvaliacao.prepend(criarFigure(filmeAdicionado, usuario));
                todos.prepend(criarFigure(filmeAdicionado, usuario));
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
    requireLogin();

    const usuario = await getUsuarioLogado();
    const filmesAguardandoAvaliacao = await buscarFilmesAguardandoAvaliacao({ discordId: usuario.discordId });
    const filmes = await buscarFilmes();
    
    // criarCardsRecentes();
    criarCardsAguardandoAvaliacao(usuario, filmesAguardandoAvaliacao);
    criarCardsTodos(usuario, filmes);

    const btnPesquisar = document.querySelector(".adicionar");
    btnPesquisar.addEventListener('click', () => abrirModalNovoFilme());
});