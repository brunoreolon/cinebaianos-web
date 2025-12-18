import { ApiError } from '../../exception/api-error.js';
import { criarMensagem } from '../../components/mensagens.js';
import { MensagemTipo } from '../../components/mensagem-tipo.js';
import { atualizarAtivacaoConta, atualizarAdmin } from '../../services/admin-service.js';
import { MY_DISCORD_ID } from '../../../config.js';

export function abrirModalPermissoes(dados, usuarioLogado) {
    const modal = document.getElementById('modal-gerenciar-permissoes');
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    modal.querySelector(".nome").textContent = dados.nome;
    modal.querySelector(".email").textContent = dados.email;
    modal.querySelector("img").src = dados.avatar;

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
        admin: !!dados.isAdmin
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
            if (dados.discordId === MY_DISCORD_ID && dados.discordId != usuarioLogado.discordId) {
                criarMensagem("Você tentou… e falhou miseravelmente 😎", MensagemTipo.ERROR);
                return;
            }

            const promises = [];

            if (dados.isAtivo !== estadoInicial.ativo) {
                promises.push(atualizarAtivacaoConta(dados.discordId, dados.isAtivo));
            }

            if (dados.isAdmin !== estadoInicial.admin) {
                promises.push(atualizarAdmin(dados.discordId, dados.isAdmin));
            }

            if (promises.length === 0) {
                fecharModal(modal);
                return;
            }

            await Promise.all(promises);

            criarMensagem("Permissões atualizadas com sucesso.", MensagemTipo.SUCCESS);

            const tr = document.querySelector(`tr[data-discord-id="${dados.discordId}"]`);
            if (tr) {
                // Atualiza badge de status
                const spanStatus = tr.querySelector('[data-label="Status"] .badge');
                spanStatus.className = `badge ${dados.isAtivo ? "badge-ativo" : "badge-inativo"}`;
                spanStatus.innerHTML = dados.isAtivo
                    ? "<i class='fa-regular fa-circle-check'></i> Ativo"
                    : "<i class='fa-solid fa-ban'></i> Inativo";

                // Atualiza badge de admin
                const spanAdmin = tr.querySelector('[data-label="Usuário"] .role .badge');
                if (spanAdmin) {
                    if (dados.isAdmin) {
                        spanAdmin.classList.add("badge-admin");
                        spanAdmin.innerHTML = '<i class="fa-solid fa-shield"></i> Admin';
                    } else {
                        spanAdmin.classList.remove("badge-admin");
                        spanAdmin.innerHTML = "";
                    }
                }
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