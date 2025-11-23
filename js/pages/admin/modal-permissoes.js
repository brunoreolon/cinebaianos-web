function abrirModalPermissoes(dados) {
    const modal = document.getElementById('modal-gerenciar-permissoes');
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    modal.querySelector(".nome").textContent = dados.nome;
    modal.querySelector(".email").textContent = dados.email;
    modal.querySelector("img").src = dados.avatar;

    const checkboxAtivo = modal.querySelector("#toggle-ativo");
    const checkboxAdmin = modal.querySelector("#toggle-admin");
    const alerta = modal.querySelector(".alerta-permissao");

    // Preenche os checkboxes
    checkboxAtivo.checked = !!dados.isAtivo;
    checkboxAdmin.checked = !!dados.isAdmin;

    // Se o usuário estiver editando a si mesmo
    if (dados.isLogado) {
        checkboxAdmin.disabled = true;
        alerta.style.display = "block";
    } else {
        checkboxAdmin.disabled = false;
        alerta.style.display = "none";
    }

    // Atualiza o objeto "dados" quando o usuário interage com os checkboxes
    checkboxAtivo.addEventListener('change', () => {
        dados.isAtivo = checkboxAtivo.checked;
    });

    checkboxAdmin.addEventListener('change', () => {
        dados.isAdmin = checkboxAdmin.checked;
    });

    // Botão Concluído envia os dados (aqui apenas exemplo de log)
    modal.querySelector(".btn-concluir").onclick = () => {
        console.log("Dados atualizados:", dados);
        // Aqui você pode chamar sua função para enviar para a API
        // ex: atualizarUsuario(dados);
        fecharModal(modal);
    };

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300); 
}