async function incluirHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;

    const resposta = await fetch('/partial/header.html');
    const html = await resposta.text();

    container.innerHTML = html;

    montarMenuUsuario();
    exibirMenuUsuario();
}

async function incluirFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;

    const resposta = await fetch('/partial/footer.html');
    const html = await resposta.text();

    container.innerHTML = html;
}

incluirHeader();
incluirFooter();