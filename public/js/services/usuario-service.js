import { apiFetch } from '../auth.js';

/**
 * Retorna os dados de um usuário pelo seu Discord ID
 * @param {string} discordId - ID do usuário no Discord
 * @returns {Promise<Object>} Objeto usuário
 * @throws {ApiError} Lança erro se a requisição falhar
 */
export async function getUsuarioById(discordId) {
    const url = new URL(`/api/users/${discordId}`, window.location.origin);
    const response = await apiFetch(url);

    return await response.json();
}

/**
 * Altera os dados de um usuário
 * @param {string} discordId - ID do usuário
 * @param {Object} dados - Dados do usuário a atualizar
 * @param {string} dados.avatar - URL do avatar
 * @param {string} dados.name - Nome do usuário
 * @param {string} dados.email - Email do usuário
 * @param {string} dados.biography - Biografia do usuário
 * @returns {Object} Usuário atualizado
 */
export async function alterarDadosUsuario(discordId, dados) {
    const url = new URL(`/api/users/${discordId}`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    return await response.json();
}

export async function buscarUsuarios(incluirBot = false) {
    const url = new URL(`/api/users`, window.location.origin);
    url.searchParams.append('includeBot', incluirBot);

    const response = await apiFetch(url);

    return await response.json();
}

export async function buscarStatisticasUsuario(discordId) {
    const url = new URL(`/api/users/${discordId}/summary`, window.location.origin);
    const response = await apiFetch(url);

    return await response.json();
}