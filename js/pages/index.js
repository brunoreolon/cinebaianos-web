function criarCardsRecentes() {
    const divPai = obterElementoPaiByClass('.recentes .inline');

    filmes.forEach(f => {
        const figure = criarFigure(f, usuario.discordId);
        divPai.appendChild(figure);
    });
}

function criarCardsAguardandoAvaliacao() {
    const usuario = usuarioLogado('339251538998329354');

    const divPai = obterElementoPaiByClass('.aguardando-avaliacao .inline');

    const filmesFiltrados = filmes.filter(filme => {
        return !isUsuarioVotouNoFilme(filme.votes, usuario.discordId);
    });

    filmesFiltrados.forEach(f => {
        const figure = criarFigure(f, usuario.discordId);
        divPai.appendChild(figure);
    });
}

function criarCardsTodos() {
    const usuario = usuarioLogado('339251538998329354');

    const divPai = obterElementoPaiByClass('.todos .inline');

    filmes.forEach(f => {
        const figure = criarFigure(f, usuario.discordId);
        divPai.appendChild(figure);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // criarCardsRecentes();
    criarCardsAguardandoAvaliacao();
    criarCardsTodos();

    const btnPesquisar = document.querySelector(".adicionar");
    btnPesquisar.addEventListener('click', () => abrirModalNovoFilme());
});

function abrirModalNovoFilme() {
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

    btnPesquisar.onclick = () => {
        const pesquisa = titulo.value.toLowerCase();
        const resultados = filmesAdicionar.filter(f =>
            f.movie.title.toLowerCase().includes(pesquisa)
        );

        listaFilmes.innerHTML = "";

        if (resultados.length > 0) {
            dica.style.display = "none";
            renderizarFilmes(filmesAdicionar, listaFilmes);
            containerFilmesEncontrados.style.display = "block";
        } else {
            containerFilmesEncontrados.style.display = "none";
        }
    };

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function renderizarFilmes(filmes, listaFilmes) {
    if (filmes.length === 0) {
        containerFilmesEncontrados.style.display = "none";
        return;
    }

    filmes.forEach(f => {
        const movie = f.movie;
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
                        <p>${movie.year}</p>
                    </div>
                </div>

                <p class="sinopse">${movie.synopsis || "Sem sinopse disponível."}</p>
            </div>
        `;

        li.style.cursor = "pointer";
        li.onclick = () => {
            adicionarFilme(movie); // ← aqui adiciona o filme
        };

        listaFilmes.appendChild(li);
    });

}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300); 
}