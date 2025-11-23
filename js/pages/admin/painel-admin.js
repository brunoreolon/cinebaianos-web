function renderUsuarios(usuarios) {
    const tabelaUsuarios = document.querySelector("#usuarios tbody");
    const tabelaBots = document.querySelector("#bots tbody");

    tabelaUsuarios.innerHTML = "";
    tabelaBots.innerHTML = "";

    usuarios.forEach(usuario => {
        const tr = document.createElement("tr");
        tr.dataset.discordId = usuario.discordId;
        tr.dataset.isAdmin = usuario.isAdmin;
        tr.dataset.isAtivo = usuario.isAtivo;
        tr.dataset.isLogado = (usuario.discordId === '339251538998329354');

        const conteudoUsuario = usuario.isBot ? `
            <td data-label="Bot">
                <div class="bots-info">
                    <img src="${usuario.avatar}" alt="Avatar Bot">
                    <div class="nome">
                        <span>${usuario.name}</span>
                    </div>
                </div>
            </td>
        ` : `
            <td data-label="Usuário">
                <div class="usuarios-info">
                    <img src="${usuario.avatar}" alt="Avatar ${usuario.name}">
                    <div class="usuario-texto">
                        <div class="nome-badge">
                            <span class="nome">${usuario.name}</span>
                            ${usuario.discordId === '339251538998329354' ? '<span class="badge badge-voce">Você</span>' : ""}
                        </div>
                        <div class="role">
                            <span class="badge ${usuario.isAdmin ? "badge-admin" : ""}">
                                ${usuario.isAdmin ? '<i class="fa-solid fa-shield"></i> Admin' : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </td>
        `;
        
        const email = `<td data-label="Email">${usuario.email}</td>`;
        const created = `<td data-label="Membro Desde">${usuario.created}</td>`;
        const status = `<td data-label="Status">
            <span class="badge ${usuario.isAtivo ? "badge-ativo" : "badge-inativo"}">
                ${usuario.isAtivo ? "<i class='fa-regular fa-circle-check'></i>" : "<i class='fa-solid fa-ban'></i>"}
                ${usuario.isAtivo ? "Ativo" : "Inativo"}
            </span>
        </td>`;

        const estatisticas = usuario.isBot ? "" : `
            <td data-label="Estatísticas">
                <div class="estatisticas">
                    <div>0 Filmes</div>
                    <div>0 Votos</div>
                </div>
            </td>`;

        const acoes = `
            <td data-label="Ações">
                <div class="${usuario.isBot ? "acoes-bot" : "acoes-usuario"}">
                    <button class="btn-acoes btn-redefinir">
                        <i class="fa-solid fa-key"></i> Redefinir Senha
                    </button>
                    <button class="btn-acoes btn-permissoes">
                        <i class="fa-solid fa-shield"></i> Permissões
                    </button>
                </div>
            </td>`;

        tr.innerHTML = conteudoUsuario + email + created + status + (usuario.isBot ? "" : estatisticas) + acoes;

        if (usuario.isBot) tabelaBots.appendChild(tr);
        else tabelaUsuarios.appendChild(tr);
    });

    initModaisUsuarios();
}

function renderVotos(votos) {
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

        div.querySelector('.btn-editar').onclick = () => abrirModalVoto(voto);
        div.querySelector('.btn-excluir').onclick = () => {
            if (confirm(`Deseja realmente excluir o voto "${voto.nome}"?`)) {
                votos.splice(i, 1);
                renderVotos(votos); // reaplica eventos
            }
        };
    });
}

function initModaisUsuarios() {
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
        btn.onclick = () => abrirModalPermissoes(dados);
    });
}

// function initModaisVotos() {
//     const btnEditar = document.querySelectorAll('.btn-editar');
//     btnEditar.forEach((btn, index) => {
//         btn.addEventListener('click', () => {
//             const voto = {
//                 nome: document.querySelectorAll('.voto h3')[index].textContent,
//                 descricao: document.querySelectorAll('.voto p')[index].textContent,
//                 cor: document.querySelectorAll('.voto span')[index].textContent,
//                 emoji: document.querySelectorAll('.emoji-voto')[index].textContent
//             };
//             abrirModalVoto(voto);
//         });
//     });

//     const btnExcluir = document.querySelectorAll('.btn-excluir');
//     btnExcluir.forEach((btn, index) => {
//         btn.addEventListener('click', () => {
//             // Aqui você pode abrir um modal de confirmação ou deletar direto
//             console.log("Excluir voto", index);
//         });
//     });
// }

document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    document.querySelectorAll('.btn-menu').forEach((btn, index) => {
        btn.onclick = () => {
            document.querySelectorAll('.btn-menu').forEach(b => b.classList.remove('ativo'));
            document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('ativo'));
            btn.classList.add('ativo');
            document.querySelectorAll('.tab-pane')[index].classList.add('ativo');
        };
    });

    // Botão novo voto
    const btnCadastrar = document.querySelector('.btn-novo');
    if (btnCadastrar) btnCadastrar.onclick = () => abrirModalVoto();

    renderUsuarios(usuarios); // lista mock/real
    renderVotos(votos);       // lista mock/real
});