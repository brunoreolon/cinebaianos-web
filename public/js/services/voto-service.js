import { authService } from './auth-service.js';

/**
 * Serviço para gerenciamento de votos via API.
 * Todas as chamadas usam `authService.apiFetch` para lidar com autenticação e refresh automático.
 */
export class VotoService {

    /**
     * Retorna a lista de tipos de voto disponíveis.
     *
     * @returns {Promise<Array>} - Lista de tipos de voto
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarTiposVotos() {
        const url = new URL(`/api/vote-types`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }

     /**
     * Retorna os votos que os usuários receberam.
     *
     * @returns {Promise<Array>} - Lista de usuarios com os votos recebidos
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarStatisticasVotosRecebidosUsuarios() {
        const url = new URL(`/api/votes/received`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Registra o voto de um usuário em um filme.
     *
     * @param {number|string} movieId - ID do filme
     * @param {string} discordId - ID do usuário
     * @param {number|string} votoId - ID do voto escolhido
     * @returns {Promise<Object>} - Objeto do voto registrado
     * @throws {ApiError} - Se a requisição falhar
     */
    async votar(movieId, discordId, votoId) {
        const corpo = {
            voter: { discordId },
            movie: { id: Number(movieId) },
            vote: Number(votoId)
        };

        const url = new URL(`/api/votes`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        return await response.json();
    }

    /**
     * Altera o voto de um usuário em um filme.
     *
     * @param {number|string} movieId - ID do filme
     * @param {string} discordId - ID do usuário
     * @param {number|string} votoId - ID do voto escolhido
     * @returns {Promise<Object>} - Objeto do voto atualizado
     * @throws {ApiError} - Se a requisição falhar
     */
    async alterarVoto(movieId, discordId, votoId) {
        const corpo = { id: Number(votoId) };

        const url = new URL(`/api/votes/users/${discordId}/movies/${movieId}`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        return await response.json();
    }

    /**
     * Cria um novo tipo de voto.
     *
     * @param {Object} voto - Dados do voto
     * @param {string} voto.name
     * @param {string} voto.description
     * @param {string} voto.color
     * @param {string} voto.emoji
     * @returns {Promise<Object>} - Tipo de voto criado
     * @throws {ApiError} - Se a requisição falhar
     */
    async criarTipoVoto(voto) {
        const corpo = { 
            name: voto.name, 
            description: voto.description, 
            color: voto.color,
            emoji: voto.emoji
        };

        const url = new URL(`/api/vote-types`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        return await response.json();
    }

    /**
     * Atualiza um tipo de voto existente.
     *
     * @param {Object} voto - Dados do voto
     * @param {number|string} voto.id - ID do tipo de voto
     * @param {string} voto.name
     * @param {string} voto.description
     * @param {string} voto.color
     * @param {string} voto.emoji
     * @returns {Promise<Object>} - Tipo de voto atualizado
     * @throws {ApiError} - Se a requisição falhar
     */
    async atualizarTipoVoto(voto) {
        const corpo = { 
            name: voto.name, 
            description: voto.description, 
            color: voto.color,
            emoji: voto.emoji
        };

        const url = new URL(`/api/vote-types/${voto.id}`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        return await response.json();
    }

    /**
     * Exclui um tipo de voto.
     *
     * @param {number|string} id - ID do tipo de voto
     * @returns {Promise<boolean|Object>} - true se sucesso, ou objeto de erro se falhar
     */
    async excluirTipoVoto(id) {
        const url = new URL(`/api/vote-types/${id}`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            return await response.json();
        }

        return true;
    }
}

export const votoService = new VotoService();