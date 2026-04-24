import { authService } from './auth-service.js';

/**
 * Serviço para gerenciamento de usuários via API.
 * Todas as chamadas usam `authService.apiFetch` para lidar com autenticação e refresh automático.
 */
export class UsuarioService {

    /**
     * Retorna os dados de um usuário pelo seu Discord ID.
     *
     * @param {string} discordId - ID do usuário no Discord
     * @returns {Promise<Object>} - Objeto usuário
     * @throws {ApiError} - Se a requisição falhar
     */
    async getUsuarioById(discordId) {
        const url = new URL(`/api/users/${discordId}`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Altera os dados de um usuário.
     *
     * @param {string} discordId - ID do usuário
     * @param {Object} dados - Dados do usuário a atualizar
     * @param {string} [dados.avatar] - URL do avatar
     * @param {string} [dados.name] - Nome do usuário
     * @param {string} [dados.email] - Email do usuário
     * @param {string} [dados.biography] - Biografia do usuário
     * @returns {Promise<Object>} - Usuário atualizado
     * @throws {ApiError} - Se a requisição falhar
     */
    async alterarDadosUsuario(discordId, dados) {
        const url = new URL(`/api/users/${discordId}`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        return await response.json();
    }

    /**
     * Busca todos os usuários, com opção de incluir bots.
     *
     * @param {boolean} [incluirBot=false] - Incluir bots na listagem
     * @returns {Promise<Array>} - Lista de usuários
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarUsuarios(incluirBot = false) {
        const url = new URL(`/api/users`, window.location.origin);
        url.searchParams.append('includeBot', incluirBot);

        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Busca estatísticas de um usuário pelo id (id do banco), podendo filtrar por grupo.
     *
     * @param {number} userId - ID do usuário (id do banco)
     * @param {number} [groupId] - ID do grupo (opcional)
     * @returns {Promise<Object>} - Estatísticas do usuário
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarStatisticasUsuario(userId, groupId = null) {
        const url = new URL(`/api/users/${userId}/summary`, window.location.origin);
        if (groupId) {
            url.searchParams.append('groupId', groupId);
        }
        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Retorna os votos que o usuário recebeu.
     *
     * @param {string} discordId - ID do usuário
     * @returns {Promise<Array>} - Lista de votos recebidos
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarStatisticasVotosRecebidosUsuario(discordId) {
        const url = new URL(`/api/users/${discordId}/votes/received`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Retorna os votos que o usuário deu.
     *
     * @param {string} discordId - ID do usuário
     * @returns {Promise<Array>} - Lista de votos dados
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarStatisticasVotosDadosUsuario(discordId) {
        const url = new URL(`/api/users/${discordId}/votes/given`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }

}

export const usuarioService = new UsuarioService();