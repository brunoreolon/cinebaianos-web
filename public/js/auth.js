// Tipo de storage: localStorage (persistente) ou sessionStorage (sessão)
function getStorage() {
    return sessionStorage.getItem("useSession") === "true" ? sessionStorage : localStorage;
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

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errorCode || "Falha no login");
    }

    const data = await response.json();

    // Salva flag do tipo de storage
    sessionStorage.setItem("useSession", remember ? "false" : "true");

    // Salva tokens e expiry no storage correto
    const storage = getStorage();
    storage.setItem("accessToken", data.accessToken);
    storage.setItem("refreshToken", data.refreshToken);
    storage.setItem("tokenExpiry", Date.now() + data.expiresInSeconds * 1000);

    return data;
}

/** Logout do usuário */
export async function logout() {
    const storage = getStorage();
    const refreshToken = storage.getItem("refreshToken");

    // Limpa storage
    storage.removeItem("accessToken");
    storage.removeItem("refreshToken");
    storage.removeItem("tokenExpiry");

    // Limpa flag de sessão
    sessionStorage.removeItem("useSession");

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
    const token = storage.getItem("accessToken");
    const expiry = storage.getItem("tokenExpiry");

    if (!token || !expiry) return false;
    return Date.now() < Number(expiry);
}

/** Redireciona para login se não estiver logado */
export function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "./login.html";
    }
}

/** Renova token usando refresh token */
export async function refreshToken() {
    const storage = getStorage();
    const refreshToken = storage.getItem("refreshToken");
    if (!refreshToken) throw new Error("Sem refresh token");

    const response = await fetch(`/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) throw new Error("Falha ao renovar token");

    const data = await response.json();
    storage.setItem("accessToken", data.accessToken);
    storage.setItem("tokenExpiry", Date.now() + data.expiresInSeconds * 1000);

    return data.accessToken;
}

/**
 * Wrapper para fetch que adiciona token e renova se necessário
 * @param {string} url 
 * @param {object} options 
 */
export async function apiFetch(url, options = {}) {
    const storage = getStorage();
    let token = storage.getItem("accessToken");
    const expiry = storage.getItem("tokenExpiry");

    // Se token expirou, tenta refresh
    if (!token || Date.now() > Number(expiry)) {
        try {
            token = await refreshToken();
        } catch (err) {
            console.warn("Refresh falhou:", err);
            window.location.href = "./login.html";
            return;
        }
    }

    // Adiciona token no header
    options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    return fetch(url, options);
}

export async function getUsuarioLogado() {
    const storage = getStorage();
    const token = storage.getItem("accessToken");
    if (!token) return null;

    try {
        const res = await fetch(`/api/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            return null;
        }

        const user = await res.json();
        return user;
    } catch (err) {
        console.error('Erro ao buscar usuário logado:', err);
        return null;
    }
}