const API = 'http://localhost:8888';

function showMsg(text, type) {
    const el = document.getElementById('msg');
    el.textContent = text;
    el.className = 'msg ' + type;
}

async function doLogin(e) {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const btn      = document.getElementById('btn');

    btn.disabled    = true;
    btn.textContent = 'A aguardar...';

    try {
        const res = await fetch(`${API}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Verifica conquistas após login (não bloqueia o redirect se falhar)
            try {
                await fetch(`${API}/api/achievements/check`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + data.data.token }
                });
            } catch (_) { /* silencioso */ }

            showMsg('Login efectuado! A redirecionar...', 'success');
            setTimeout(() => window.location.href = 'profile.html', 1000);
        } else {
            showMsg(data.error || 'Erro ao fazer login.', 'error');
        }
    } catch (err) {
        showMsg('Não foi possível ligar ao servidor.', 'error');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Entrar';
    }
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (form) form.addEventListener('submit', doLogin);
});