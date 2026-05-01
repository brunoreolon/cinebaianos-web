import { authService } from './auth-service.js';

function normalizarVotos(votes = []) {
    const votosPorUsuario = new Map();

    votes.forEach(vote => {
        const userId = vote?.voter?.id;
        if (userId === null || userId === undefined) return;

        const key = String(userId);
        const atual = votosPorUsuario.get(key);
        if (!atual) {
            votosPorUsuario.set(key, vote);
            return;
        }

        const atualData = new Date(atual?.vote?.votedAt || 0).getTime();
        const novaData = new Date(vote?.vote?.votedAt || 0).getTime();
        if (novaData >= atualData) {
            votosPorUsuario.set(key, vote);
        }
    });

    return [...votosPorUsuario.values()];
}

function normalizarFilme(movie) {
    if (!movie) return movie;

    return {
        ...movie,
        votes: normalizarVotos(movie.votes || [])
    };
}

function normalizarFilmes(movies = []) {
    return movies.map(normalizarFilme);
}

function normalizarRespostaComMovies(payload) {
    if (!payload || !Array.isArray(payload.movies)) {
        return payload;
    }

    return {
        ...payload,
        movies: normalizarFilmes(payload.movies)
    };
}

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
     * @param {number|string} [params.chooserId] - Filtrar por usuário que escolheu o filme
     * @param {string} [params.title] - Filtrar por título do filme
     * @returns {Promise<Object>} - Objeto com filmes e informações de paginação
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmes({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', chooserId, voteTypeId, genreId, title } = {}) {
        const url = new URL(`/api/movies`, window.location.origin);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortDir', sortDir);

        if (chooserId) url.searchParams.append('chooserId', chooserId);
        if (title) url.searchParams.append('title', title);
        if (voteTypeId) url.searchParams.append('voteTypeId', voteTypeId);
        if (genreId) url.searchParams.append('genreId', genreId);

        const response = await authService.apiFetch(url);

        const data = await response.json();
        return normalizarRespostaComMovies(data);
    }

    /**
     * Busca filmes aguardando avaliação com paginação e filtros opcionais.
     *
     * @param {Object} params - Parâmetros de busca
     * @param {number} [params.page=0]
     * @param {number} [params.size=100]
     * @param {string} [params.sortBy='dateAdded']
     * @param {string} [params.sortDir='desc']
     * @param {number|string} [params.userId] - Filtrar por usuário
     * @param {string} [params.title] - Filtrar por título
     * @returns {Promise<Array>} - Lista de filmes aguardando avaliação
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmesAguardandoAvaliacao({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', userId, title } = {}) {
        const url = new URL(`/api/movies/awaiting-review`, window.location.origin);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortDir', sortDir);

        if (userId) url.searchParams.append('userId', userId);
        if (title) url.searchParams.append('title', title);

        const response = await authService.apiFetch(url);
        const data = await response.json();

        return normalizarFilmes(data.movies || []);
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

        const data = await response.json();
        return normalizarFilme(data);
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
     * Busca filmes com detalhes pelo título na TMDB.
     *
     * @param {string} titulo - Título do filme
     * @returns {Promise<Object>} - Resultado da busca na TMDB
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmesComDetalhesPorTitulo(titulo) {
        const url = new URL(`/api/tmdb/search/movies-details`, window.location.origin);
        url.searchParams.append('title', titulo);

        const response = await authService.apiFetch(url);
        return await response.json();
    }

    /**
     * Adiciona um filme ao sistema.
     *
     * @param {number|string} tmdbId - ID do filme na TMDB
     * @param {number|string} userId - ID do usuário que escolheu
     * @param {string|number|null} [votoId=null] - ID do voto, se houver
     * @returns {Promise<Object>} - Objeto do filme adicionado
     * @throws {ApiError} - Se a requisição falhar
     */
    async adicionarFilme(tmdbId, userId, votoId = null) {
        const corpo = {
            movie: { id: tmdbId },
            chooser: { id: Number(userId) }
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

        const data = await response.json();
        return normalizarFilme(data);
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

    /**
     * Busca todos os filmes de um grupo.
     *
     * @param {number|string} groupId - ID do grupo
     * @returns {Promise<Object>} - GroupDetailResponse com campo `movies`
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmesDoGrupo(groupId) {
        const url = new URL(`/api/groups/${groupId}/movies`, window.location.origin);
        const response = await authService.apiFetch(url);
        const data = await response.json();
        return normalizarRespostaComMovies(data);
    }

    /**
     * Busca um filme específico dentro de um grupo pelo ID do filme.
     *
     * @param {number|string} groupId - ID do grupo
     * @param {number|string} movieId - ID do filme
     * @returns {Promise<Object|null>} - MovieWithChooserResponse ou null
     * @throws {ApiError} - Se a requisição falhar
     */
    async buscarFilmeDoGrupo(groupId, movieId) {
        const groupDetail = await this.buscarFilmesDoGrupo(groupId);
        const movie = groupDetail.movies?.find(m => m.id === Number(movieId)) || null;
        return normalizarFilme(movie);
    }

    /**
     * Adiciona um filme ao grupo pelo ID do TMDb.
     *
     * @param {number|string} groupId - ID do grupo
     * @param {number|string} tmdbId - ID do filme no TMDb
     * @param {number|string} userId - ID interno do usuário (chooser)
     * @returns {Promise<Object>} - GroupDetailResponse atualizado
     * @throws {ApiError} - Se a requisição falhar
     */
    async adicionarFilmeAoGrupo(groupId, tmdbId, userId) {
        const url = new URL(`/api/groups/${groupId}/movies`, window.location.origin);
        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                movie: { id: tmdbId },
                chooser: { id: userId }
            })
        });
        const data = await response.json();
        return normalizarRespostaComMovies(data);
    }

    /**
     * Remove um filme de um grupo.
     *
     * @param {number|string} groupId - ID do grupo
     * @param {number|string} movieId - ID do filme
     * @returns {Promise<boolean>} - true se removido com sucesso
     * @throws {ApiError} - Se a requisição falhar
     */
    async removerFilmeDoGrupo(groupId, movieId) {
        const url = new URL(`/api/groups/${groupId}/movies/${movieId}`, window.location.origin);
        await authService.apiFetch(url, { method: 'DELETE' });
        return true;
    }
}

export const filmeService = new FilmeService();