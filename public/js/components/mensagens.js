import { MensagemTipo } from './mensagem-tipo.js';

export function criarMensagem(texto, tipo = MensagemTipo.INFO, duracao = 8000) {
    const container = document.querySelector('.mensagem-container');

    // Criação do alerta
    const alert = document.createElement('div');
    alert.className = `alert ${tipo.css}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fa-solid ${tipo.icon}"></i>
            <span class="alert-text">${texto}</span>
        </div>
        <button class="alert-close">&times;</button>
    `;

    // Adiciona o novo alerta ao container
    container.appendChild(alert);

    // Funcionalidade de animação de entrada
    requestAnimationFrame(() => {
        alert.classList.add('show');
    });

    // Função de fechamento (remover a mensagem da tela)
    const fechar = () => {
        alert.classList.remove('show');
        alert.classList.add('fechar');

        // Remover do DOM após animação de fechamento
        alert.addEventListener('transitionend', () => {
            container.removeChild(alert);
        });
    };

    // Fechar ao clicar no botão
    alert.querySelector('.alert-close').addEventListener('click', fechar);

    // Fechar automaticamente após o tempo de duração
    if (duracao > 0) {
        setTimeout(() => fechar(), duracao);
    }
}


// criarMensagem('Filme adicionado com sucesso!', MensagemTipo.SUCCESS);
// criarMensagem('Erro ao carregar dados.', MensagemTipo.ERROR);
// criarMensagem('Novo aviso disponível.', MensagemTipo.INFO);
// criarMensagem('Novo alerta!', MensagemTipo.ALERT);