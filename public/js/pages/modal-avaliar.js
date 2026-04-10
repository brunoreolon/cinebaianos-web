import { votoService } from '../services/voto-service.js';
import { filmeService } from '../services/filme-service.js';
import { form, criarFooter, ordenarVotosPorDescricao } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

export async function abrirModalAvaliacao(filme, usuario, atualizarTelaDetalhes = false, index, groupId = null) {
    const modal = document.querySelector('#modal-avaliar');
    const normalizedGroupId = groupId !== null && groupId !== undefined && groupId !== '' ? Number(groupId) : null;
    modal.classList.remove('inativo');
    modal.classList.remove('fechando');
    modal.classList.add('ativo');

    const opcoesContainer = modal.querySelector('#opcoes-voto ul');
    opcoesContainer.innerHTML = '';

    try {
        const votos = ordenarVotosPorDescricao(await votoService.buscarTiposVotosDisponiveis(normalizedGroupId));

        votos.forEach(v => {
            const li = document.createElement('li');
            li.dataset.votoId = v.id;
            li.style.background = v.color;
            li.innerHTML = `
                <span class="modal-vote-emoji">${v.emoji}</span>
                <span class="modal-vote-text">
                    <span class="modal-vote-title">${v.description}</span>
                    <span class="modal-vote-subtitle">Selecionar esta avaliação</span>
                </span>
            `;

            li.addEventListener('click', async () => {
                try {
                    const votoId = li.dataset.votoId;
                    let resultado;

                    const votosDoFilme = Array.isArray(filme.votes) ? filme.votes : [];
                    const usuarioVotou = votosDoFilme.some(v => v.voter.discordId === usuario.discordId);
                    if (usuarioVotou) {
                        resultado = normalizedGroupId
                            ? await votoService.alterarVotoNoGrupo(normalizedGroupId, usuario.id, filme.id, votoId)
                            : await votoService.alterarVoto(filme.id, usuario.discordId, votoId);
                        criarMensagem(`Voto alterado para ${resultado.vote.description} no filme "${filme.title}"!`, MensagemTipo.SUCCESS);
                    } else {
                        resultado = normalizedGroupId
                            ? await votoService.votarNoGrupo(normalizedGroupId, usuario.id, filme.id, votoId)
                            : await votoService.votar(filme.id, usuario.discordId, votoId);
                        criarMensagem(`Voto ${resultado.vote.description} registrado para "${filme.title}"!`, MensagemTipo.SUCCESS);
                    }

                    fecharModal(modal);

                    // Atualiza dados do filme a partir do grupo
                    let filmeAtualizado = filme;
                    if (normalizedGroupId) {
                        const atualizado = await filmeService.buscarFilmeDoGrupo(normalizedGroupId, filme.id);
                        if (atualizado) {
                            filmeAtualizado = atualizado;
                            filme.votes = atualizado.votes;
                        }
                    }

                    if (atualizarTelaDetalhes) {
                        window.dispatchEvent(new CustomEvent('filmeAtualizado', {
                            detail: filmeAtualizado
                        }));
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
    modal.onclick = e => {
        if (e.target === modal) fecharModal(modal);
    };
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