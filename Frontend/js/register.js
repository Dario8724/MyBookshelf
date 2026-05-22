const API = 'http://localhost:8888';

function showMsg(text, type) {
    const el = document.getElementById('msg');
    el.textContent = text;
    el.className = 'msg ' + type;
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const img = document.getElementById('avatar-img');
        const svg = document.querySelector('.avatar-preview svg');
        img.src = e.target.result;
        img.style.display = 'block';
        if (svg) svg.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

async function doRegister(e) {
    e.preventDefault();

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const avatar   = document.getElementById('avatar-input').files[0];
    const btn      = document.getElementById('btn');

    btn.disabled    = true;
    btn.textContent = 'A aguardar...';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    if (avatar) formData.append('profile_image', avatar);

    try {
        const res = await fetch(`${API}/api/users/register`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            showMsg('Conta criada! A redirecionar...', 'success');
            // Redirect direto para profile (já está autenticado)
            setTimeout(() => window.location.href = 'profile.html', 1000);
        } else {
            showMsg(data.error || 'Erro ao criar conta.', 'error');
        }
    } catch (err) {
        showMsg('Não foi possível ligar ao servidor.', 'error');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Criar conta';
    }
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
    const form         = document.getElementById('register-form');
    const avatarInput  = document.getElementById('avatar-input');

    if (form) form.addEventListener('submit', doRegister);
    if (avatarInput) avatarInput.addEventListener('change', previewAvatar);
});