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
     * Busca estatísticas de um usuário.
     *
     * @param {string} discordId - ID do usuário
     * @returns {Promise<Object>} - Estatísticas do usuário
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarStatisticasUsuario(discordId) {
        const url = new URL(`/api/users/${discordId}/summary`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }
}

export const usuarioService = new UsuarioService();