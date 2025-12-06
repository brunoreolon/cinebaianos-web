document.addEventListener('DOMContentLoaded', () => {
    const usuario = usuarioLogado('339251538998329354');

    document.getElementById("fotoUrl").value = usuario.avatar || "";
    document.querySelector(".foto-atual img").src = usuario.avatar || "./assets/img/placeholder-avatar.png";

    document.getElementById("nome").value = usuario.name || "";
    document.getElementById("email").value = usuario.email || "";
    document.getElementById("bio").value = usuario.biograpy || "";

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
});