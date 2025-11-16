function montarMenuUsuario() {
    const usuario = usuarioLogado('339251538998329354');
    const avatarContainer = form.avatarContainer();
    const dropdownContainer = form.dropdownContainer();

    const divAvatar = criarElemento('div', ['avatar-wrapper']);

    const linkAvatar = criarElemento('a');
    linkAvatar.href = '#';

    const img = criarElemento('img', ['avatar']);
    img.src = usuario.avatar || '/assets/img/placeholder-avatar.png';

    linkAvatar.appendChild(img);
    divAvatar.appendChild(linkAvatar);
    avatarContainer.appendChild(divAvatar);

    const menu = criarElemento('div', ['dropdown-menu', 'border']);
    menu.innerHTML = `
        <nav>
            <ul>
                <li>
                    <a href="perfil.html?id=${usuario.discordId}">
                        <i class="fa-regular fa-user space"></i>
                        Meu Perfil
                    </a>
                </li>
                <li>
                    <a href="?id=${usuario.discordId}">
                        <i class="fa-solid fa-gear space"></i>
                        Editar perfil
                    </a>
                </li>
                <li class="separator"></li>
                <li>
                    <a href="#">
                        <i class="fa-solid fa-shield space"></i>
                        <span class="rosa">Painel Admin</span>
                    </a>
                </li>
                <li class="separator"></li>
                <li>
                    <a href="#">
                        <i class="fa-solid fa-arrow-right-from-bracket space"></i>
                        <span class="vermelho">Sair</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    dropdownContainer.appendChild(menu);
}

function exibirMenuUsuario() {
    const avatarContainer = form.avatarContainer();
    const dropdownContainer = form.dropdownContainer();
    const menu = dropdownContainer.querySelector('.dropdown-menu');

    avatarContainer.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.toggle('active');
    });

    dropdownContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('a');

        if (item) {
            menu.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target) && !avatarContainer.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
}
