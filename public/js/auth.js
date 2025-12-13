import { ApiError } from './exception/api-error.js';

/* =========================
 * Constantes
 * ========================= */
const STORAGE_KEYS = {
    ACCESS: "accessToken",
    REFRESH: "refreshToken",
    EXPIRY: "tokenExpiry",
    USE_SESSION: "useSession"
};

/* =========================
 * Storage helper
 * ========================= */
function getStorage() {
    return sessionStorage.getItem(STORAGE_KEYS.USE_SESSION) === "true"
        ? sessionStorage
        : localStorage;
}

/**
 * Login do usuário
 * @param {string} username 
 * @param {string} password 
 * @param {boolean} remember - true = persistente (localStorage), false = apenas sessão (sessionStorage)
 */
export async function login(username, password, remember = true) {
    const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new ApiError(data);
    }

    // Define tipo de storage
    sessionStorage.setItem(
        STORAGE_KEYS.USE_SESSION,
        remember ? "false" : "true"
    );

    const storage = getStorage();
    storage.setItem(STORAGE_KEYS.ACCESS, data.accessToken);
    storage.setItem(STORAGE_KEYS.REFRESH, data.refreshToken);
    storage.setItem(
        STORAGE_KEYS.EXPIRY,
        Date.now() + data.expiresInSeconds * 1000
    );

    return data;
}

/** Logout do usuário */
export async function logout() {
    const storage = getStorage();
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH);

    // Limpa storage
    storage.removeItem("accessToken");
    storage.removeItem("refreshToken");
    storage.removeItem("tokenExpiry");

    // Limpa flag de sessão
    sessionStorage.removeItem(STORAGE_KEYS.USE_SESSION);

    // Faz POST na API para invalidar refresh token
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

    // Redireciona para login
    window.location.href = "./login.html";
}

/** Verifica se usuário está logado */
export function isLoggedIn() {
    const storage = getStorage();
    const token = storage.getItem(STORAGE_KEYS.ACCESS);
    const expiry = storage.getItem(STORAGE_KEYS.EXPIRY);

    return Boolean(token) && expiry && Date.now() < Number(expiry);
}

/** Redireciona para login se não estiver logado */
export function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "./login.html";
    }
}

export async function requireAdmin() {
    const usuario = await getUsuarioLogado();

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

/** Renova token usando refresh token */
let refreshingPromise = null;

async function doRefresh() {
    const storage = getStorage();
    const refreshToken = storage.getItem(STORAGE_KEYS.REFRESH);
    if (!refreshToken) {
        throw new Error("Sem refresh token");
    }

    const response = await fetch(`/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
        throw new Error("Falha ao renovar token");
    }

    const data = await response.json();

    storage.setItem(STORAGE_KEYS.ACCESS, data.accessToken);
    storage.setItem(
        STORAGE_KEYS.EXPIRY,
        Date.now() + data.expiresInSeconds * 1000
    );

    return data.accessToken;
}

export async function refreshToken() {
    if (!refreshingPromise) {
        refreshingPromise = doRefresh()
            .finally(() => refreshingPromise = null);
    }
    return refreshingPromise;
}

/**
 * Wrapper para fetch que adiciona token e renova se necessário
 * @param {string} url 
 * @param {object} options 
 */
export async function apiFetch(url, options = {}) {
    const storage = getStorage();
    let token = storage.getItem(STORAGE_KEYS.ACCESS);
    const expiry = storage.getItem(STORAGE_KEYS.EXPIRY);

    // Se token expirou, tenta refresh
    if (!token || Date.now() > Number(expiry)) {
        try {
            token = await refreshToken();
        } catch (err) {
            storage.removeItem(STORAGE_KEYS.ACCESS);
            storage.removeItem(STORAGE_KEYS.REFRESH);
            storage.removeItem(STORAGE_KEYS.EXPIRY);
            sessionStorage.removeItem(STORAGE_KEYS.USE_SESSION);

            if (err?.errorCode === 'expired_refresh_token' || err?.errorCode === 'invalid_refresh_token') {
                window.location.href = "./login.html";
                return;
            }

            throw new ApiError({
                status: err?.status || 500,
                detail: err?.detail || "Falha ao renovar o token de acesso.",
                errorCode: err?.errorCode || "unknown_error"
            });
        }
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
        try {
            data = await response.json();
        } catch (_) {}

        throw new ApiError(data);
    }

    return response;
}

export async function getUsuarioLogado() {
    try {
        const res = await apiFetch('/api/users/me');
        return await res.json();
    } catch (err) {
        console.warn("Erro ao buscar usuário logado:", err);
        return null;
    }
}