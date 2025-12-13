import { buscarTiposVotos, votar, alterarVoto } from '../services/voto-service.js';
import { buscarFilmePorId } from '../services/filme-service.js';
import { form, criarFooter } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

export async function abrirModalAvaliacao(filme, usuario, atualizarTelaDetalhes = false, index) {
    const modal = document.querySelector('#modal-avaliar');
    modal.classList.remove('inativo');
    modal.classList.add('ativo');

    const opcoesContainer = modal.querySelector('#opcoes-voto ul');
    opcoesContainer.innerHTML = '';

    try {
        const votos = await buscarTiposVotos();

        votos.forEach(v => {
            const li = document.createElement('li');
            li.dataset.votoId = v.id;
            li.textContent = v.emoji + v.description;
            li.style.background = v.color;
            li.style.cursor = 'pointer';

            li.addEventListener('click', async () => {
                try {
                    const votoId = li.dataset.votoId;
                    let resultado;

                    const usuarioVotou = filme.votes.some(v => v.voter.discordId === usuario.discordId);
                    if (usuarioVotou) {
                        resultado = await alterarVoto(filme.id, usuario.discordId, votoId);
                        criarMensagem(`Voto alterado para ${resultado.vote.description} no filme "${filme.title}"!`, MensagemTipo.SUCCESS);
                    } else {
                        resultado = await votar(filme.id, usuario.discordId, votoId);
                        criarMensagem(`Voto ${resultado.vote.description} registrado para "${filme.title}"!`, MensagemTipo.SUCCESS);
                    }

                    fecharModal(modal);

                    const filmeAtualizado = await buscarFilmePorId(filme.id);
                    filme.votes = filmeAtualizado.votes;

                    if (atualizarTelaDetalhes) {
                        const evento = new CustomEvent('filmeAtualizado', {
                            detail: filmeAtualizado
                        });
                        window.dispatchEvent(evento);
                    }

                    if (index) {
                        // Remove da lista de aguardando avaliação
                        const aguardando = form.aguardandoAvaliacao();
                        const cardA = aguardando.querySelector(`[data-tmdb-id="${filme.tmdbId}"]`)?.closest("a");
                        if (cardA) cardA.remove();

                        // Atualiza footer no card da lista geral
                        const todosLista = form.todos();
                        const cardTodos = todosLista.querySelector(`[data-tmdb-id="${filme.tmdbId}"]`);
                        if (cardTodos) {
                            const novoFooter = criarFooter(filmeAtualizado, usuario);
                            const footerAntigo = cardTodos.querySelector('footer.card-footer');
                            if (footerAntigo) footerAntigo.replaceWith(novoFooter);
                        }
                    }
                } catch (err) {
                    fecharModal(modal);

                    if (err instanceof ApiError) {
                        criarMensagem(err.detail || 'Erro ao registrar voto.', MensagemTipo.ERROR);
                    } else {
                        criarMensagem('Erro de conexão com o servidor.', MensagemTipo.ERROR);
                        console.error(err);
                    }
                }
            });

            opcoesContainer.appendChild(li);
        });
    } catch (err) {
        criarMensagem('Não foi possível carregar os tipos de voto.', MensagemTipo.ERROR);
        console.error(err);
    }

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.addEventListener('click', e => {
        if (e.target === modal) fecharModal(modal);
    });
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => {
        modal.classList.add('inativo');
    }, 300); 
}