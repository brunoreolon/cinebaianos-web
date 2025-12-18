import { adminService } from '../../services/admin-service.js';
import { ApiError } from '../../exception/api-error.js';
import { criarMensagem } from '../../components/mensagens.js';
import { MensagemTipo } from '../../components/mensagem-tipo.js';

export function abrirModalRedefinirSenha(dados) {
    const modal = document.getElementById('modal-redefinir-senha');
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    modal.dataset.discordId = dados.discordId;

     // Seleciona os elementos do modal para exibir nome e email
    const nomeEl = modal.querySelector(".nome-usuario");  // crie essa classe no span do modal
    const emailEl = modal.querySelector(".email-usuario"); // crie essa classe no span do modal
    const senha = modal.querySelector("#senha");
    const btnRedefinir = modal.querySelector(".btn-redefinir-senha");

    // Preenche as informações
    nomeEl.textContent = dados.nome;
    emailEl.textContent = dados.email;
    
    btnRedefinir.onclick = async () => {
        if (senha.value.length < 6) {
            alert("A senha deve ter no mínimo 6 caracteres");
            return;
        }
        try {
            const novaSenha = await adminService.redefinirSenha(modal.dataset.discordId, senha.value);
            fecharModal(modal);
            criarMensagem(`Senha redefinida com sucesso para o usuário ${dados.nome}. Um email será enviado para o usuário contendo a nova senha`, MensagemTipo.SUCCESS);
        } catch(err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || "Erro ao redefinir senha.", MensagemTipo.ERROR);
            } else {
                criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
            }
        }
    };

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.querySelector('.btn-cancelar').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300); 
}