import { ApiError } from '../exception/api-error.js';

/**
 * Constantes de chaves usadas no storage
 * @private
 */
const STORAGE_KEYS = {
    ACCESS: "accessToken",
    REFRESH: "refreshToken",
    EXPIRY: "tokenExpiry",
    USE_SESSION: "useSession"
};

export class AuthService {
    constructor() {
        this.refreshingPromise = null;
    }

    /**
     * Retorna o storage correto (sessionStorage ou localStorage)
     * @private
     * @returns {Storage} - O storage a ser usado
     */
    _getStorage() {
        return sessionStorage.getItem(STORAGE_KEYS.USE_SESSION) === "true"
            ? sessionStorage
            : localStorage;
    }

    /**
     * Faz login do usuário e armazena tokens.
     *
     * @param {string} username - Nome do usuário
     * @param {string} password - Senha
     * @param {boolean} remember - true = persistente (localStorage), false = apenas sessão (sessionStorage)
     * @returns {Promise<{accessToken: string, refreshToken: string, expiresInSeconds: number}>}
     * @throws {ApiError} - Lança erro se credenciais forem inválidas ou API falhar
     * @effect Armazena tokens no storage e define tipo de sessão
     */
    async login(username, password, remember = true) {
        const response = await fetch(`/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (!response.ok) throw new ApiError(data);

        sessionStorage.setItem(STORAGE_KEYS.USE_SESSION, remember ? "false" : "true");
        const storage = this._getStorage();
        storage.setItem(STORAGE_KEYS.ACCESS, data.accessToken);
        storage.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
        storage.setItem(STORAGE_KEYS.EXPIRY, Date.now() + data.expiresInSeconds * 1000);

        return data;
    }

    /**
     * Faz logout do usuário.
     *
     * @returns {Promise<void>}
     * @effect Remove tokens e flag de sessão do storage.
     * @effect Envia POST para /api/auth/logout para invalidar refresh token.
     * @effect Redireciona o usuário para login.html
     */
    async logout() {
        const storage = this._getStorage();
        const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH);

        storage.removeItem(STORAGE_KEYS.ACCESS);
        storage.removeItem(STORAGE_KEYS.REFRESH);
        storage.removeItem(STORAGE_KEYS.EXPIRY);
        sessionStorage.removeItem(STORAGE_KEYS.USE_SESSION);

        if (refreshToken) {
            try {
                await fetch(`/api/auth/logout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken })
                });
            } catch (err) {
                console.warn("Falha ao invalidar refresh token:", err);
            }
        }

        window.location.href = "./login.html";
    }

    /**
     * Verifica se o usuário está logado.
     *
     * @returns {boolean} - true se existe token válido no storage, false caso contrário
     */
    isLoggedIn() {
        const storage = this._getStorage();
        const token = storage.getItem(STORAGE_KEYS.ACCESS);
        const expiry = storage.getItem(STORAGE_KEYS.EXPIRY);

        return Boolean(token) && expiry && Date.now() < Number(expiry);
    }

    /**
     * Redireciona para login se o usuário não estiver logado.
     *
     * @returns {void}
     */
    requireLogin() {
        if (!this.isLoggedIn()) {
            window.location.href = "./login.html";
        }
    }

    /**
     * Verifica se o usuário logado tem permissões de administrador.
     *
     * @returns {Promise<Object>} - Dados do usuário logado
     * @throws {ApiError} - Lança erro 403 se o usuário não for admin
     */
    async requireAdmin() {
        const usuario = await this.getUsuarioLogado();

        if (!usuario || !usuario.admin) {
            throw new ApiError({
                status: 403,
                title: "Acesso negado",
                detail: "Você não tem permissão para acessar esta página.",
                errorCode: "access_denied"
            });
        }

        return usuario;
    }

    /**
     * Renova o token de acesso usando o refresh token.
     *
     * @returns {Promise<string>} - Novo access token
     * @throws {Error} - Se não houver refresh token ou falhar a renovação
     * @private
     */
    async _doRefresh() {
        const storage = this._getStorage();
        const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH);
        if (!refreshToken) throw new Error("Sem refresh token");

        const response = await fetch(`/api/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) throw new Error("Falha ao renovar token");

        const data = await response.json();
        storage.setItem(STORAGE_KEYS.ACCESS, data.accessToken);
        storage.setItem(STORAGE_KEYS.EXPIRY, Date.now() + data.expiresInSeconds * 1000);
        return data.accessToken;
    }

    /**
     * Wrapper que evita múltiplas chamadas simultâneas de refresh.
     *
     * @returns {Promise<string>} - Novo access token
     */
    async refreshToken() {
        if (!this.refreshingPromise) {
            this.refreshingPromise = this._doRefresh().finally(() => this.refreshingPromise = null);
        }
        return this.refreshingPromise;
    }

    /**
     * Wrapper para fetch que adiciona token de autorização
     * e renova token se necessário.
     *
     * @param {string} url - Endpoint da API
     * @param {object} options - Opções do fetch (method, headers, body etc.)
     * @returns {Promise<Response>} - Response do fetch
     * @throws {ApiError} - Se a requisição falhar ou retornar erro da API
     */
    async apiFetch(url, options = {}) {
        const storage = this._getStorage();
        let token = storage.getItem(STORAGE_KEYS.ACCESS);
        const expiry = storage.getItem(STORAGE_KEYS.EXPIRY);

        if (!token || Date.now() > Number(expiry)) {
            token = await this.refreshToken();
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            let data = {};
            try { data = await response.json(); } catch (_) {}
            throw new ApiError(data);
        }

        return response;
    }

    /**
     * Retorna os dados do usuário logado.
     *
     * @returns {Promise<Object|null>} - Dados do usuário ou null se não estiver logado ou falhar
     */
    async getUsuarioLogado() {
        try {
            const res = await this.apiFetch('/api/users/me');
            return await res.json();
        } catch (err) {
            console.warn("Erro ao buscar usuário logado:", err);
            return null;
        }
    }

    /**
     * Inicia processo de recuperação de login (envia e-mail de recuperação).
     *
     * @param {string} email - E-mail do usuário
     * @returns {Promise<Object>} - Dados retornados pela API
     * @throws {ApiError} - Se a API retornar erro
     */
    async recuperarLogin(email) {
        const response = await fetch(`/api/auth/recover`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        let data = {};
        try {
            data = await response.json();
        } catch (_) {}

        if (!response.ok) {
            throw new ApiError(data);
        }

        return data;
    }

    /**
     * Redefine a senha do usuário usando token de recuperação.
     *
     * @param {string} token - Token de recuperação enviado por e-mail
     * @param {string} newPassword - Nova senha do usuário
     * @returns {Promise<boolean>} - Retorna true se a senha foi redefinida com sucesso
     * @throws {ApiError} - Se a API retornar erro
     */
    async redefinirSenha(token, newPassword) {
        const url = new URL(`/api/auth/reset-password`, window.location.origin);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        if (!response.ok) {
            let data = {};
            try { data = await response.json(); } catch (_) {}
            throw new ApiError(data);
        }

        return true;
    }
}

export const authService = new AuthService();