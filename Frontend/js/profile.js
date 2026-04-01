let currentUser = null;
let allBooks = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    //tabs 
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        });
    });

    // file input preview
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const p = document.getElementById('previewAvatar');
            p.innerHTML = `<img src="${ev.target.result}" alt="preview">`;
        };
        reader.readAsDataURL(file);
    });

    await loadProfile();
    await loadLibrary();
});

// -- carregar perfil ---
async function loadProfile() {
    try {
        const res = await fetch(`${API}/api/users/me`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success) {
            window.location.href = 'login.html';
            return;
        }

        currentUser = data.data.user;

        //buscar seguidores e seguindo
        const [fwrs, fwng] = await Promise.all([
            fetch(`${API}/api/users/${currentUser.user_id}/followers`, { headers: authHeader() }).then(r => r.json()),
            fetch(`${API}/api/users/${currentUser.user_id}/following`, { headers: authHeader() }).then(r => r.json()),
        ]);

        const followersCount = fwrs.success ? fwrs.data.total : 0;
        const followingCount = fwng.success ? fwng.data.total : 0;

        renderProfile(currentUser, followersCount, followingCount);
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        showToast('Erro ao carregar perfil.', 'error');
    }
}

function renderProfile(user, followersCount, followingCount) {
    const header = document.getElementById('profileHeader');

    const avatar = user.profile_image
        ? `<img src="${API}/${user.profile_image}" alt="${user.name}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:3px solid var(--border)">`
        : `<div style="width:110px;height:110px;border-radius:50%;background:var(--surface2);border:3px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:2.5rem;color:var(--muted)">${user.name.charAt(0).toUpperCase()}</div>`;

    header.innerHTML = `
        ${avatar}
        <div class="profile-info">
            <div class="profile-name">${user.name}</div>
            <div class="profile-email">${user.email}</div>
            <div class="profile-bio">${user.bio || ''}</div>
            <div class="stats">
                <div class="stat">
                    <strong>${followersCount}</strong>
                    <span>seguidores</span>
                </div>
                <div class="stat">
                    <strong>${followingCount}</strong>
                    <span>a seguir</span>
                </div>
                <div class="stat">
                    <strong id="statBooks">-</strong>
                    <span>livros</span>
                </div>
            </div>
            <div class="profile-actions">
                <button class="btn btn-outline" onclick="openEditProfile()">Editar perfil</button>
            </div>
        </div>
    `;
}

// -- carregar biblioteca ---
async function loadLibrary() {
    try {
        const res = await fetch(`${API}/api/library`, { headers: authHeader() });
        const data = await res.json();

        allBooks = data.data && data.data.books ? data.data.books : [];

        const reading   = allBooks.filter(b => b.status === 'reading');
        const completed = allBooks.filter(b => b.status === 'completed');
        const want      = allBooks.filter(b => b.status === 'want_to_read');
        const favs      = allBooks.filter(b => b.is_favorite == 1);

        document.getElementById('statBooks').textContent    = allBooks.length;
        document.getElementById('cntAll').textContent       = `(${allBooks.length})`;
        document.getElementById('cntReading').textContent   = `(${reading.length})`;
        document.getElementById('cntCompleted').textContent = `(${completed.length})`;
        document.getElementById('cntWant').textContent      = `(${want.length})`;
        document.getElementById('cntFav').textContent       = `(${favs.length})`;

        renderGrid('tab-all',           allBooks);
        renderGrid('tab-reading',       reading);
        renderGrid('tab-completed',     completed);
        renderGrid('tab-want_to_read',  want);
        renderGrid('tab-favorites',     favs)
        
        document.getElementById('librarySection').style.display = 'block';

    } catch (err) {
        console.error('Erro ao carregar biblioteca:', err);
        showToast('Erro ao carregar biblioteca.', 'error');
    }
}

const statusLabel = { reading: 'A ler', completed: 'Lido', want_to_read: 'Quero ler' };
const statusClass = { reading: 'badge-reading', completed: 'badge-completed', want_to_read: 'badge-want' };

function renderGrid(containerId, books) {
    const el = document.getElementById(containerId);

    if (!books.length) {
        el.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📚</div>
                <p>Nenhum livro nesta categoria ainda.</p>
            </div>`;
        return;
    }

    const cards = books.map(b => `
        <a href="book.html?id=${b.book_id}" class="book-item">
            <div class="book-cover-wrap">
                ${b.cover
                    ? `<img src="${b.cover}" alt="${b.title}" class="book-cover" loading="lazy">`
                    : `<div class="book-cover-placeholder">📖</div>`
                }
                ${b.status ? `<span class="status-badge ${statusClass[b.status] || ''}">${statusLabel[b.status] || b.status}</span>` : ''}
                ${b.favorite == 1 ? `<span class="book-fav">⭐</span>` : ''}
            </div>
            <div class="book-meta">
                <div class="book-title">${b.title}</div>
                ${b.author ? `<div class="book-author">${b.author}</div>` : ''}
            </div>
        </a>
    `).join('');

    el.innerHTML = `<div class="book-grid">${cards}</div>`;
}

// ── MODAL EDITAR PERFIL ───────────────────────────────────
function openEditModal() {
    if (!currentUser) return;
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editBio').value  = currentUser.bio  || '';
    document.getElementById('fileInput').value = '';

    const p = document.getElementById('previewAvatar');
    p.innerHTML = currentUser.profile_image
        ? `<img src="${API}/${currentUser.profile_image}" alt="avatar">`
        : currentUser.name.charAt(0).toUpperCase();

    document.getElementById('editOverlay').classList.add('open');
}

function closeEditModal() {
    document.getElementById('editOverlay').classList.remove('open');
}

async function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const bio  = document.getElementById('editBio').value.trim();
    const file = document.getElementById('fileInput').files[0];
    const btn  = document.getElementById('saveBtn');

    if (!name) { showToast('O nome é obrigatório.', 'error'); return; }

    btn.disabled    = true;
    btn.textContent = 'A guardar...';

    try {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('bio', bio);
        if (file) fd.append('profile_image', file);

        const res  = await fetch(`${API}/api/users/profile`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() },
            body: fd,
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            closeEditModal();
            await loadProfile();
            const statBooks = document.getElementById('statBooks');
            if (statBooks) statBooks.textContent = allBooks.length;
            showToast('Perfil actualizado com sucesso!');
        } else {
            showToast(data.error || 'Erro ao actualizar.', 'error');
        }
    } catch {
        showToast('Não foi possível ligar ao servidor.', 'error');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Guardar';
    }
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// fechar modal ao clicar fora
document.getElementById('editOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEditModal();
});