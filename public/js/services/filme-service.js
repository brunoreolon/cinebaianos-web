import { authService } from './auth-service.js';

/**
 * Serviço para gerenciamento de filmes via API.
 * Todas as chamadas usam `authService.apiFetch` para lidar com autenticação e refresh automático.
 */
export class FilmeService {

    /**
     * Busca filmes com paginação, ordenação e filtros opcionais.
     *
     * @param {Object} params - Parâmetros de busca
     * @param {number} [params.page=0] - Página inicial
     * @param {number} [params.size=100] - Quantidade de filmes por página
     * @param {string} [params.sortBy='dateAdded'] - Campo para ordenação
     * @param {string} [params.sortDir='desc'] - Direção da ordenação ('asc' ou 'desc')
     * @param {string} [params.discordId] - Filtrar por usuário que escolheu o filme
     * @param {string} [params.title] - Filtrar por título do filme
     * @returns {Promise<Object>} - Objeto com filmes e informações de paginação
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmes({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', discordId, voteTypeId, genreId, title } = {}) {
        const url = new URL(`/api/movies`, window.location.origin);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortDir', sortDir);

        if (discordId) url.searchParams.append('chooserDiscordId', discordId);
        if (title) url.searchParams.append('title', title);
        if (voteTypeId) url.searchParams.append('voteTypeId', voteTypeId);
        if (genreId) url.searchParams.append('genreId', genreId);

        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Busca filmes aguardando avaliação com paginação e filtros opcionais.
     *
     * @param {Object} params - Parâmetros de busca
     * @param {number} [params.page=0]
     * @param {number} [params.size=100]
     * @param {string} [params.sortBy='dateAdded']
     * @param {string} [params.sortDir='desc']
     * @param {string} [params.discordId] - Filtrar por usuário
     * @param {string} [params.title] - Filtrar por título
     * @returns {Promise<Array>} - Lista de filmes aguardando avaliação
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmesAguardandoAvaliacao({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', discordId, title } = {}) {
        const url = new URL(`/api/movies/awaiting-review`, window.location.origin);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortDir', sortDir);

        if (discordId) url.searchParams.append('discordId', discordId);
        if (title) url.searchParams.append('title', title);

        const response = await authService.apiFetch(url);
        const data = await response.json();

        return data.movies || [];
    }

    /**
     * Busca filme por ID.
     *
     * @param {string|number} id - ID do filme
     * @returns {Promise<Object>} - Objeto do filme
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmePorId(id) {
        const url = new URL(`/api/movies/${id}`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }

    /**
     * Busca filmes pelo título na TMDB.
     *
     * @param {string} titulo - Título do filme
     * @returns {Promise<Object>} - Resultado da busca na TMDB
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmesPorTitulo(titulo) {
        const url = new URL(`/api/tmdb/search/movies`, window.location.origin);
        url.searchParams.append('title', titulo);

        const response = await authService.apiFetch(url);
        return await response.json();
    }

    /**
     * Adiciona um filme ao sistema.
     *
     * @param {number|string} tmdbId - ID do filme na TMDB
     * @param {string} discordId - Discord ID do usuário que escolheu
     * @param {string|number|null} [votoId=null] - ID do voto, se houver
     * @returns {Promise<Object>} - Objeto do filme adicionado
     * @throws {ApiError} - Se a requisição falhar
     */
    async adicionarFilme(tmdbId, discordId, votoId = null) {
        const corpo = {
            movie: { id: tmdbId },
            chooser: { discordId }
        };

        if (votoId !== null) {
            corpo.vote = { id: votoId };
        }

        const url = new URL(`/api/movies`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        return await response.json();
    }

    /**
     * Exclui um filme pelo ID.
     *
     * @param {string|number} id - ID do filme
     * @returns {Promise<boolean>} - Retorna true se a exclusão foi bem-sucedida
     * @throws {ApiError} - Se a requisição falhar
     */
    async excluirFilme(id) {
        const url = new URL(`/api/movies/${id}`, window.location.origin);
        await authService.apiFetch(url, { method: 'DELETE' });

        return true;
    }

    async buscarGeneros() {
        const url = new URL(`/api/genres`, window.location.origin);
        const response = await authService.apiFetch(url);

        return await response.json();
    }
}

export const filmeService = new FilmeService();