import { buscarTiposVotos, votar } from '../services/voto-service.js';
import { buscarFilmePorId } from '../services/filme-service.js';
import { form, criarFooter } from '../global.js';

export async function abrirModalAvaliacao(filme, usuario, atualizarTelaDetalhes, index) {
    const modal = document.querySelector('#modal-avaliar');
    modal.classList.remove('inativo');
    modal.classList.add('ativo');

    const opcoesContainer = modal.querySelector('#opcoes-voto ul');
    opcoesContainer.innerHTML = '';

    const votos = await buscarTiposVotos();

    votos.forEach(v => {
        const li = document.createElement('li');
        li.dataset.votoId = v.id;
        li.textContent = v.emoji + v.description;
        li.style.background = v.color;
        li.style.cursor = 'pointer';

        li.addEventListener('click', async () => {
            const votoId = li.dataset.votoId;
            const novoVoto = await votar(filme.id, usuario.discordId, votoId);

            if (!novoVoto) return;

            modal.classList.add('inativo');

            const filmeAtualizado = await buscarFilmePorId(filme.id);

            if (atualizarTelaDetalhes) {
                const evento = new CustomEvent('filmeAtualizado', {
                    detail: filmeAtualizado
                });

                window.dispatchEvent(evento);
            }
            
            fecharModal(modal);

            if (index) {
                const aguardando = form.aguardandoAvaliacao();
                const cardA = aguardando.querySelector(`[data-tmdb-id="${filme.tmdbId}"]`)?.closest("a");
                if (cardA) cardA.remove();

                const todosLista = form.todos();
                const cardTodos = todosLista.querySelector(`[data-tmdb-id="${filme.tmdbId}"]`);
                if (cardTodos) {
                    const novoFooter = criarFooter(filmeAtualizado, usuario);
                    const footerAntigo = cardTodos.querySelector('footer.card-footer');
                    if (footerAntigo) footerAntigo.replaceWith(novoFooter);
                }
            }
        });

        opcoesContainer.appendChild(li);
    });

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