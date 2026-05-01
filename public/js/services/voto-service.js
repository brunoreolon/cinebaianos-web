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
     * @param {number|string} userId - ID do usuário
     * @param {number|string} votoId - ID do voto escolhido
     * @returns {Promise<Object>} - Objeto do voto registrado
     * @throws {ApiError} - Se a requisição falhar
     */
    async votar(movieId, userId, votoId) {
        const corpo = {
            voter: { id: Number(userId) },
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
     * @param {number|string} userId - ID do usuário
     * @param {number|string} votoId - ID do voto escolhido
     * @returns {Promise<Object>} - Objeto do voto atualizado
     * @throws {ApiError} - Se a requisição falhar
     */
    async alterarVoto(movieId, userId, votoId) {
        const corpo = { id: Number(votoId) };

        const url = new URL(`/api/votes/users/${userId}/movies/${movieId}`, window.location.origin);

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

    /**
     * Registra o voto de um usuário em um filme dentro de um grupo.
     *
     * @param {number|string} groupId - ID do grupo
     * @param {number|string} userId - ID interno do usuário votante
     * @param {number|string} movieId - ID do filme
     * @param {number|string} votoId - ID do tipo de voto
     * @returns {Promise<Object>} - VoteDetailResponse
     * @throws {ApiError} - Se a requisição falhar
     */
    async votarNoGrupo(groupId, userId, movieId, votoId) {
        const url = new URL(`/api/groups/${groupId}/votes`, window.location.origin);
        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voter: { id: Number(userId) },
                movie: { id: Number(movieId) },
                vote: Number(votoId)
            })
        });
        return await response.json();
    }

    /**
     * Altera o voto de um usuário em um filme dentro de um grupo.
     *
     * @param {number|string} groupId - ID do grupo
     * @param {number|string} voterId - ID interno do usuário votante
     * @param {number|string} movieId - ID do filme
     * @param {number|string} votoId - ID do novo tipo de voto
     * @returns {Promise<Object>} - VoteDetailResponse
     * @throws {ApiError} - Se a requisição falhar
     */
    async alterarVotoNoGrupo(groupId, voterId, movieId, votoId) {
        const url = new URL(`/api/groups/${groupId}/votes/users/${voterId}/movies/${movieId}`, window.location.origin);
        const response = await authService.apiFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: Number(votoId) })
        });
        return await response.json();
    }

    async buscarTiposVotosDoGrupo(groupId) {
        const url = new URL(`/api/groups/${groupId}/vote-types`, window.location.origin);
        const response = await authService.apiFetch(url);
        return await response.json();
    }

    async buscarTiposVotosGlobaisNoGrupo(groupId) {
        const url = new URL(`/api/groups/${groupId}/vote-types/global`, window.location.origin);
        const response = await authService.apiFetch(url);
        return await response.json();
    }

    async buscarTiposVotosDisponiveis(groupId = null) {
        if (groupId !== null && groupId !== undefined && groupId !== '') {
            const url = new URL(`/api/groups/${groupId}/vote-types/available`, window.location.origin);
            const response = await authService.apiFetch(url);
            return await response.json();
        }

        return this.buscarTiposVotos();
    }

    async criarTipoVotoDoGrupo(groupId, voto) {
        const url = new URL(`/api/groups/${groupId}/vote-types`, window.location.origin);
        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: voto.name,
                description: voto.description,
                color: voto.color,
                emoji: voto.emoji
            })
        });
        return await response.json();
    }

    async atualizarTipoVotoDoGrupo(groupId, voto) {
        const url = new URL(`/api/groups/${groupId}/vote-types/${voto.id}`, window.location.origin);
        const response = await authService.apiFetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: voto.name,
                description: voto.description,
                color: voto.color,
                emoji: voto.emoji
            })
        });
        return await response.json();
    }

    async excluirTipoVotoDoGrupo(groupId, voteTypeId) {
        const url = new URL(`/api/groups/${groupId}/vote-types/${voteTypeId}`, window.location.origin);
        await authService.apiFetch(url, {
            method: 'DELETE'
        });
        return true;
    }

    /**
     * Busca o ranking de votos recebidos por membros do grupo.
     * @param {number} groupId - ID do grupo
     * @param {number|null} voteTypeId - ID do tipo de voto (opcional)
     * @returns {Promise<Array>} - Lista de UserVoteStatsResponse
     */
    async buscarRankingVotosRecebidosGrupo(groupId, voteTypeId = null) {
        let url = new URL(`/api/groups/${groupId}/votes/received`, window.location.origin);
        if (voteTypeId) url.searchParams.set('vote', voteTypeId);
        const response = await authService.apiFetch(url);
        return await response.json();
    }
}

export const votoService = new VotoService();