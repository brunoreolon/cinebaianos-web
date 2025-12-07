function criarMensagem(texto, tipo = 'info', duracao = 8000) {
    const container = document.querySelector('.mensagem-container');

    const alert = document.createElement('div');
    alert.className = `alert ${tipo}`;
    alert.innerHTML = `
        ${texto}
        <button class="alert-close">&times;</button>
    `;

    container.appendChild(alert);

    // Mostrar com animação
    requestAnimationFrame(() => {
        alert.classList.add('show');
    });

    const fechar = () => {
        alert.classList.remove('show');
        alert.classList.add('fechar');

        setTimeout(() => {
            alert.classList.remove('fechar');
            alert.classList.add('remover');
        }, 150); // tempo da primeira etapa

        setTimeout(() => {
            container.removeChild(alert);
        }, 500); // tempo total da animação
    };

    // Fechar ao clicar no X
    alert.querySelector('.alert-close').addEventListener('click', fechar);

    // Fechar automaticamente após a duração
    if (duracao > 0) {
        setTimeout(fechar, duracao);
    }
}


// criarMensagem('Filme adicionado com sucesso!', 'success', 6000);
// criarMensagem('Erro ao carregar dados.', 'error', 7000);
// criarMensagem('Novo aviso disponível.', 'info');