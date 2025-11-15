function criarCardsRecentes() {
    const divPai = obterElementoPaiByClass('.recentes .inline');

    filmes.forEach(f => {
        const figure = criarFigure(f);
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
        const figure = criarFigure(f);

        if (!isUsuarioVotouNoFilme(f.votes, usuario.discordId)) {
            const botao = criarBotaoAvaliar();
            figure.appendChild(botao);
        }

        divPai.appendChild(figure);
    });
}

function criarCardsTodos() {
    const usuario = usuarioLogado('339251538998329354');

    const divPai = obterElementoPaiByClass('.todos .inline');

    filmes.forEach(f => {
        const figure = criarFigure(f);

        if (!isUsuarioVotouNoFilme(f.votes, usuario.discordId)) {
            const botao = criarBotaoAvaliar();
            figure.appendChild(botao);
        }

        if (foiAdicionadoRecentemente(f)) {
            const badge = criarBadgeFilmeRecente(f);
            figure.appendChild(badge);
        }

        divPai.appendChild(figure);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // criarCardsRecentes();
    criarCardsAguardandoAvaliacao();
    criarCardsTodos();
});