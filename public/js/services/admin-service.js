import { apiFetch } from '../auth.js';

/**
 * Atualiza o status da conta
 * @param {string} discordId - ID do usuário
 * @param {boolean} ativo - novo valor do status
 */
export async function atualizarAtivacaoConta(discordId, ativo) {
    const url = new URL(`/api/admin/users/${discordId}/activation`, window.location.origin);
    
    const resposta = apiFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: ativo })
    });

    return true;
}

/**
 * Atualiza admin de usuário
 * @param {string} discordId - ID do usuário
 * @param {boolean} admin - novo valor do status
 */
export async function atualizarAdmin(discordId, admin) {
    const url = new URL(`/api/admin/users/${discordId}/admin`, window.location.origin);

    const resposta = apiFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin: admin })
    });

    return true;
}

/**
 * Atualiza a senha do usuário
 * @param {string} discordId - ID do usuário
 * @param {string} novaSenha - novo senha
 */
export async function redefinirSenha(discordId, novaSenha) {
    const url = new URL(`/api/admin/users/${discordId}/reset-password`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: novaSenha })
    });

    return true;
}