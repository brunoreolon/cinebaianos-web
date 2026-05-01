import { adminService } from '../../services/admin-service.js';
import { ApiError } from '../../exception/api-error.js';
import { criarMensagem } from '../../components/mensagens.js';
import { MensagemTipo } from '../../components/mensagem-tipo.js';

export function abrirModalPermissoes(dados, usuarioLogado, onSaveSuccess) {
    const modal = document.getElementById('modal-gerenciar-permissoes');
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    modal.querySelector(".nome").textContent = dados.nome;
    modal.querySelector(".email").textContent = dados.email;
    const avatar = modal.querySelector("img");
    if (avatar) {
        avatar.src = dados.avatar || './assets/img/placeholder-avatar.png';
        avatar.alt = `Avatar de ${dados?.nome || 'usuário'}`;
        avatar.addEventListener('error', () => {
            avatar.src = './assets/img/placeholder-avatar.png';
        }, { once: true });
    }

    const alerta = modal.querySelector(".alerta-permissao");

    // Clona os checkboxes para remover listeners antigos
    const checkboxAtivoOld = modal.querySelector("#toggle-ativo");
    const checkboxAdminOld = modal.querySelector("#toggle-admin");

    const checkboxAtivo = checkboxAtivoOld.cloneNode(true);
    const checkboxAdmin = checkboxAdminOld.cloneNode(true);

    checkboxAtivoOld.replaceWith(checkboxAtivo);
    checkboxAdminOld.replaceWith(checkboxAdmin);

    // Define estados iniciais
    const estadoInicial = {
        ativo: !!dados.isAtivo,
        admin: !!dados.isAdmin,
        superAdmin: !!dados.superAdmin
    };

    // Preenche os checkboxes
    checkboxAtivo.checked = estadoInicial.ativo;
    checkboxAdmin.checked = estadoInicial.admin;

    // Se o usuário estiver editando a si mesmo
    if (dados.isLogado) {
        checkboxAdmin.disabled = true;
        alerta.style.display = "block";
    } else {
        checkboxAdmin.disabled = false;
        alerta.style.display = "none";
    }

    // Atualiza o objeto "dados" quando interage
    checkboxAtivo.addEventListener('change', () => {
        dados.isAtivo = checkboxAtivo.checked;
    });
    checkboxAdmin.addEventListener('change', () => {
        dados.isAdmin = checkboxAdmin.checked;
    });

    // Botão Concluído envia os dados
    const btnConcluir = modal.querySelector(".btn-concluir");
    btnConcluir.onclick = async () => {
        try {
            const promises = [];

            if (dados.isAtivo !== estadoInicial.ativo) {
                promises.push(adminService.atualizarAtivacaoConta(dados.userId, dados.isAtivo));
            }

            if (dados.isAdmin !== estadoInicial.admin) {
                promises.push(adminService.atualizarAdmin(dados.userId, dados.isAdmin));
            }

            if (promises.length === 0) {
                fecharModal(modal);
                return;
            }

            await Promise.all(promises);

            criarMensagem("Permissões atualizadas com sucesso.", MensagemTipo.SUCCESS);

            if (typeof onSaveSuccess === 'function') {
                await onSaveSuccess({
                    userId: dados.userId,
                    isAdmin: !!dados.isAdmin,
                    superAdmin: !!dados.superAdmin,
                    isAtivo: !!dados.isAtivo
                });
            }

            fecharModal(modal);
        } catch (err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || "Erro ao atualizar permissões.", MensagemTipo.ERROR);
            } else {
                criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
            }
        }
    };

    // Fechar modal
    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300);
}