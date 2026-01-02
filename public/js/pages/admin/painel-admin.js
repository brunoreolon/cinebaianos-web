import { authService } from '../../services/auth-service.js';
import { usuarioService } from '../../services/usuario-service.js';
import { votoService } from '../../services/voto-service.js';
import { formatarData, ordenarVotosPorDescricao, ordenarUsuariosPorNome } from '../../global.js';
import { abrirModalVoto } from '../../pages/admin/modal-cadastrar-voto.js';
import { abrirModalRedefinirSenha } from '../../pages/admin/modal-redefinir-senha.js';
import { abrirModalPermissoes } from '../../pages/admin/modal-permissoes.js';
import { ApiError } from '../../exception/api-error.js';
import { criarMensagem } from '../../components/mensagens.js';
import { MensagemTipo } from '../../components/mensagem-tipo.js';

async function renderUsuarios(usuarios) {
    const tabelaUsuarios = document.querySelector("#usuarios tbody");
    const tabelaBots = document.querySelector("#bots tbody");
    const usuarioLogado = await authService.getUsuarioLogado();

    tabelaUsuarios.innerHTML = "";
    tabelaBots.innerHTML = "";

    for (const usuario of usuarios) {
        const usuarioStats = await usuarioService.buscarStatisticasUsuario(usuario.discordId);

        const tr = document.createElement("tr");
        tr.dataset.discordId = usuario.discordId;
        tr.dataset.isAdmin = usuario.admin;
        tr.dataset.isAtivo = usuario.active;
        tr.dataset.isLogado = (usuario.discordId === usuarioLogado.discordId);

        const conteudoUsuario = usuario.bot ? `
            <td data-label="Bot">
                <a href="./perfil.html?id=${usuario.discordId}" class="link-perfil">
                    <div class="bots-info">
                        <img src="${usuario.avatar || './assets/img/placeholder-avatar.png'}" alt="Avatar Bot">
                        <div class="nome">
                            <span>${usuario.name}</span>
                        </div>
                    </div>
                </a>
            </td>
        ` : `
             <td data-label="Usuário">
                <a href="./perfil.html?id=${usuario.discordId}" class="link-perfil">
                    <div class="usuarios-info">
                        <img src="${usuario.avatar}" alt="Avatar ${usuario.name}">
                        <div class="usuario-texto">
                            <div class="nome-badge">
                                <span class="nome">${usuario.name}</span>
                                ${usuario.discordId === usuarioLogado.discordId ? '<span class="badge badge-voce">Você</span>' : ""}
                            </div>
                            <div class="role">
                                <span class="badge ${usuario.admin ? "badge-admin" : ""}">
                                    ${usuario.admin ? '<i class="fa-solid fa-shield"></i> Admin' : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </a>
            </td>
        `;
        
        const email = `<td data-label="Email">${usuario.email}</td>`;
        const created = `<td data-label="Membro Desde">${formatarData(usuario.joined)}</td>`;
        const status = `<td data-label="Status">
            <span class="badge ${usuario.active ? "badge-ativo" : "badge-inativo"}">
                ${usuario.active ? "<i class='fa-regular fa-circle-check'></i>" : "<i class='fa-solid fa-ban'></i>"}
                ${usuario.active ? "Ativo" : "Inativo"}
            </span>
        </td>`;

        const estatisticas = usuario.bot ? "" : `
            <td data-label="Estatísticas">
                <div class="estatisticas">
                    <div>${usuarioStats.userStats.totalMoviesAdded} Filmes</div>
                    <div>${usuarioStats.userStats.totalVotesGiven} Votos</div>
                </div>
            </td>`;

        const acoes = `
            <td data-label="Ações">
                <div class="${usuario.bot ? "acoes-bot" : "acoes-usuario"}">
                    <button class="btn-acoes btn-redefinir">
                        <i class="fa-solid fa-key"></i> Redefinir Senha
                    </button>
                    <button class="btn-acoes btn-permissoes">
                        <i class="fa-solid fa-shield"></i> Permissões
                    </button>
                </div>
            </td>`;

        tr.innerHTML = conteudoUsuario + email + created + status + (usuario.isBot ? "" : estatisticas) + acoes;

        if (usuario.bot) tabelaBots.appendChild(tr);
        else tabelaUsuarios.appendChild(tr);
    };

    initModaisUsuarios(usuarioLogado);
}

export function renderVotos(votos) {
    const containerVotos = document.querySelector(".lista-votos");
    containerVotos.innerHTML = "";

    votos.forEach((voto, i) => {
        const div = document.createElement("div");
        div.className = "voto";
        div.innerHTML = `
            <div class="voto-conteudo">
                <div class="emoji-voto">${voto.emoji}</div>
                <div class="detalhes-voto">
                    <h3>${voto.name}</h3>
                    <p>${voto.description}</p>
                    <span style="background:${voto.color}">${voto.color}</span>
                </div>
            </div>
            <div class="voto-acoes">
                <button class="btn-editar"><i class="fa-regular fa-pen-to-square"></i></button>
                <button class="btn-excluir"><i class="fa-regular fa-trash-can"></i></button>
            </div>
        `;
        containerVotos.appendChild(div);

        const btnCadastrar = document.querySelector('.btn-novo');
        if (btnCadastrar) {
            btnCadastrar.addEventListener('click', () => abrirModalVoto(null, votos));
        }

        div.querySelector('.btn-editar').onclick = () => abrirModalVoto(voto, votos);

        div.querySelector('.btn-excluir').onclick = async () => {
            if (confirm(`Deseja realmente excluir o voto "${voto.name}"?`)) {
                try{
                    const excluir = await votoService.excluirTipoVoto(voto.id);
                    criarMensagem(`Voto ${voto.description} excluido com sucesso!`, MensagemTipo.SUCCESS);

                    votos = votos.filter(v => v.id !== voto.id);

                    renderVotos(votos);
                } catch(err) {
                    if (err instanceof ApiError) {
                        criarMensagem(err.detail || "Erro ao excluir tipo de voto.", MensagemTipo.ERROR);
                    } else {
                        criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
                    }
                }
                
            }
        };
    });
}

function initModaisUsuarios(usuarioLogado) {
    // Redefinir senha
    document.querySelectorAll('.btn-redefinir').forEach(btn => {
        const linha = btn.closest("tr");
        const dados = {
            nome: linha.querySelector(".usuarios-info .nome, .bots-info .nome span").textContent.trim(),
            email: linha.querySelector("[data-label='Email']").textContent,
            discordId: linha.dataset.discordId
        };
        btn.onclick = () => abrirModalRedefinirSenha(dados);
    });

    // Permissões
    document.querySelectorAll('.btn-permissoes').forEach(btn => {
        const linha = btn.closest("tr");
        const dados = {
            nome: linha.querySelector(".usuarios-info .nome, .bots-info .nome span").textContent.trim(),
            email: linha.querySelector("[data-label='Email']").textContent,
            discordId: linha.dataset.discordId,
            avatar: linha.querySelector("img").src,
            isAdmin: linha.dataset.isAdmin === "true",
            isAtivo: linha.dataset.isAtivo === "true",
            isLogado: linha.dataset.isLogado === "true"
        };
        btn.onclick = () => abrirModalPermissoes(dados, usuarioLogado);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';

    try {
        authService.requireLogin();
        await authService.requireAdmin();

        // Tabs
        document.querySelectorAll('.btn-menu').forEach((btn, index) => {
            btn.onclick = () => {
                document.querySelectorAll('.btn-menu').forEach(b => b.classList.remove('ativo'));
                document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('ativo'));
                btn.classList.add('ativo');
                document.querySelectorAll('.tab-pane')[index].classList.add('ativo');
            };
        });

        const usuarios = ordenarUsuariosPorNome(await usuarioService.buscarUsuarios(true));
        const votos = ordenarVotosPorDescricao(await votoService.buscarTiposVotos());

        renderUsuarios(usuarios);
        renderVotos(votos);

    } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
            sessionStorage.setItem("flashMessage", JSON.stringify({
                texto: err.detail,
                tipo: "ERROR"
            }));

            window.location.href = "./index.html";
            return;
        } else {
            criarMensagem(err.detail || "Erro ao carregar o painel administrativo.", MensagemTipo.ERROR);
        }
    } finally {
        if (container) container.classList.remove('inativo-js');  
        if (loader) loader.style.display = 'none';
    }
});