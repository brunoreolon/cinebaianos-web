function abrirModalRedefinirSenha(dados) {
    const modal = document.getElementById('modal-redefinir-senha');
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    modal.dataset.discordId = dados.discordId;

     // Seleciona os elementos do modal para exibir nome e email
    const nomeEl = modal.querySelector(".nome-usuario");  // crie essa classe no span do modal
    const emailEl = modal.querySelector(".email-usuario"); // crie essa classe no span do modal
    const senha = modal.querySelector("#senha");
    const btnRedefinir = modal.querySelector(".btn-redefinir-senha");

    // Preenche as informações
    nomeEl.textContent = dados.nome;
    emailEl.textContent = dados.email;
    
    btnRedefinir.onclick = () => {
        if (senha.value.length < 6) {
            alert("A senha deve ter no mínimo 6 caracteres");
            return;
        }

        const body = {
            discordId: modal.dataset.discordId,
            novaSenha: senha.value
        };
        console.log("Enviando:", body);
        // Aqui você faria o fetch() para API
        fecharModal(modal);
    };

    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.querySelector('.btn-cancelar').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300); 
}