function abrirModalAvaliacao(filme, usuario, atualizarTelaDetalhes) {
    const modal = document.querySelector('#modal-avaliar');
    modal.classList.remove('inativo');
    modal.classList.add('ativo');

    const opcoesContainer = modal.querySelector('#opcoes-voto ul');
    opcoesContainer.innerHTML = '';

    votos.forEach(v => {
        const li = document.createElement('li');
        li.textContent = v.emoji + v.description;
        li.style.background = v.color;
        li.style.cursor = 'pointer';

        li.addEventListener('click', () => {
            // TODO enviar o voto para a api
            console.log(`Usuário ${usuario.name} votou: ${v.description}`);

            modal.classList.add('inativo');

            if (atualizarTelaDetalhes) {
                const botao = document.querySelector('#botao-avaliar button');
                const minhaAvaliacao = document.querySelector('#minha-avaliacao');
                atualizarBotaoEMinhaAvaliacao(filme, usuario, botao, minhaAvaliacao);
            }
            
            fecharModal(modal);
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