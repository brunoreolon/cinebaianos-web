import { requireLogin, getUsuarioLogado } from '../auth.js';
import { alterarDadosUsuario } from '../services/usuario-service.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        requireLogin();

        const usuario = await getUsuarioLogado();
        if (!usuario) {
            window.location.href = "./login.html";
            return;
        }

        document.getElementById("fotoUrl").value = usuario.avatar || "";
        document.querySelector(".foto-atual img").src = usuario.avatar || "./assets/img/placeholder-avatar.png";
        document.getElementById("nome").value = usuario.name || "";
        document.getElementById("email").value = usuario.email || "";
        document.getElementById("bio").value = usuario.biography || "";

        // Membro desde
        if (usuario.criadoEm) {
            const data = new Date(usuario.criadoEm);
            const formatada = data.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            });

            document.querySelector(".criado-em p").textContent = formatada;
        }

        document.querySelector('.btn-salvar').addEventListener('click', async () => {
            const dados = {
                avatar: document.getElementById("fotoUrl").value,
                name: document.getElementById("nome").value,
                email: document.getElementById("email").value,
                biography: document.getElementById("bio").value
            };

            const response = await alterarDadosUsuario(usuario.discordId, dados);
            criarMensagem("Dados atualizados com sucesso!", MensagemTipo.SUCCESS);
        });

        document.querySelector('.btn-cancelar').addEventListener('click', async () => {
            const usuario = await getUsuarioLogado();
            window.location.href = `perfil.html?id=${usuario.discordId}`;
        });
    } catch (err) {
        if (err instanceof ApiError) {
            criarMensagem(err.detail || "Erro ao carregar dados do usuário.", MensagemTipo.ERROR);
        } else {
            criarMensagem(err.message || "Erro ao carregar dados do usuário.", MensagemTipo.ERROR);
        }
    }
});