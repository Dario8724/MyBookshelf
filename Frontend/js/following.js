let currentUser = null;
let currentUserId = null;
let allUsers = [];
let followingIds = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    loadUserData();
    await loadAllData();

    // Busca
    document.getElementById('searchInput').addEventListener('input', handleSearch);
});

// ===== USER DATA =====
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    currentUser = user;
    currentUserId = user.user_id;

    const navAvatar = document.getElementById('navAvatar');
    if (user.profile_image) {
        navAvatar.innerHTML = `<img src="${API}/${user.profile_image}" alt="${user.name}">`;
    } else {
        navAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
}

// ===== LOAD ALL =====
async function loadAllData() {
    document.getElementById('pageLoading').style.display = 'block';

    try {
        // 1. Buscar quem sigo
        const fRes = await fetch(`${API}/api/users/${currentUserId}/following`, { headers: authHeader() });
        const fData = await fRes.json();
        followingIds = fData.success ? fData.data.following.map(u => u.user_id) : [];

        // 2. Buscar todos os utilizadores
        const res = await fetch(`${API}/api/users`, { headers: authHeader() });
        const data = await res.json();
        allUsers = data.success ? data.data.users : [];

        document.getElementById('pageLoading').style.display = 'none';

        renderAll();
    } catch (err) {
        console.error('Erro:', err);
        document.getElementById('pageLoading').style.display = 'none';
        showToast('Erro ao carregar utilizadores.', 'error');
    }
}

// ===== RENDER =====
function renderAll(filter = '') {
    const filterLower = filter.toLowerCase().trim();

    // Filtrar pela busca
    const filtered = filterLower
        ? allUsers.filter(u =>
            u.name.toLowerCase().includes(filterLower) ||
            (u.email && u.email.toLowerCase().includes(filterLower))
        )
        : allUsers;

    const followingUsers = filtered.filter(u => followingIds.includes(u.user_id));
    const suggestionUsers = filtered.filter(u => !followingIds.includes(u.user_id));

    const followingSection = document.getElementById('followingSection');
    const suggestionsSection = document.getElementById('suggestionsSection');
    const searchEmpty = document.getElementById('searchEmpty');

    // Sem resultados na busca
    if (filterLower && filtered.length === 0) {
        followingSection.style.display = 'none';
        suggestionsSection.style.display = 'none';
        searchEmpty.style.display = 'block';
        return;
    }

    searchEmpty.style.display = 'none';

    // Secção "A seguir"
    if (followingUsers.length > 0 || !filterLower) {
        followingSection.style.display = 'block';
        document.getElementById('followingCount').textContent = followingUsers.length;
        renderUsers('followingGrid', followingUsers, true);

        const emptyEl = document.getElementById('followingEmpty');
        const gridEl = document.getElementById('followingGrid');
        if (followingUsers.length === 0) {
            emptyEl.style.display = 'block';
            gridEl.style.display = 'none';
        } else {
            emptyEl.style.display = 'none';
            gridEl.style.display = 'grid';
        }
    } else {
        followingSection.style.display = 'none';
    }

    // Secção "Sugestões"
    if (suggestionUsers.length > 0 || !filterLower) {
        suggestionsSection.style.display = 'block';
        renderUsers('suggestionsGrid', suggestionUsers, false);

        const emptyEl = document.getElementById('suggestionsEmpty');
        const gridEl = document.getElementById('suggestionsGrid');
        if (suggestionUsers.length === 0) {
            emptyEl.style.display = 'block';
            gridEl.style.display = 'none';
        } else {
            emptyEl.style.display = 'none';
            gridEl.style.display = 'grid';
        }
    } else {
        suggestionsSection.style.display = 'none';
    }
}

function renderUsers(containerId, users, isFollowing) {
    const container = document.getElementById(containerId);

    container.innerHTML = users.map(u => {
        const avatar = u.profile_image
            ? `<img src="${API}/${u.profile_image}" alt="${u.name}">`
            : `<span>${u.name.charAt(0).toUpperCase()}</span>`;

        const bio = `<div class="user-card-bio">${u.bio ? escapeHtml(u.bio) : ''}</div>`;

        const followers = u.followers_count || 0;
        const following = u.following_count || 0;

        const btnClass = isFollowing ? 'btn-follow following' : 'btn-follow';
        const btnText = isFollowing ? 'Seguindo' : 'Seguir';
        const btnIcon = isFollowing
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>`;

        return `
            <div class="user-card" id="user-card-${u.user_id}">
                <div class="user-card-avatar">${avatar}</div>
                <div class="user-card-info">
                    <div class="user-card-name">${escapeHtml(u.name)}</div>
                    ${bio}
                    <div class="user-card-stats">
                        <span><strong>${followers}</strong> seguidores</span>
                        <span class="dot"></span>
                        <span><strong>${following}</strong> a seguir</span>
                    </div>
                </div>
                <button class="${btnClass}" id="btn-${u.user_id}" onclick="toggleFollow(${u.user_id})">
                    ${btnIcon}
                    <span>${btnText}</span>
                </button>
            </div>
        `;
    }).join('');
}

// ===== TOGGLE FOLLOW =====
async function toggleFollow(userId) {
    const isFollowing = followingIds.includes(userId);

    try {
        const res = await fetch(`${API}/api/users/${userId}/follow`, {
            method: isFollowing ? 'DELETE' : 'POST',
            headers: authHeader(),
        });
        const data = await res.json();

        if (!data.success) {
            showToast(data.error || 'Erro.', 'error');
            return;
        }

        // Atualizar estado local
        if (isFollowing) {
            followingIds = followingIds.filter(id => id !== userId);
            // decrementar followers_count do user clicado
            const u = allUsers.find(x => x.user_id === userId);
            if (u) u.followers_count = Math.max(0, (u.followers_count || 0) - 1);
            showToast('Deixaste de seguir.', 'success');
        } else {
            followingIds.push(userId);
            const u = allUsers.find(x => x.user_id === userId);
            if (u) u.followers_count = (u.followers_count || 0) + 1;
            showToast('A seguir!', 'success');
        }

        // Re-renderizar mantendo o filtro atual
        const filter = document.getElementById('searchInput').value;
        renderAll(filter);
    } catch (err) {
        showToast('Erro ao ligar ao servidor.', 'error');
    }
}

// ===== SEARCH =====
function handleSearch(e) {
    renderAll(e.target.value);
}

// ===== UTILS =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}