let currentUser = null
let currentPostId = null

document.addEventListener('DOMContentLoaded', async () =>{
    if (!getToken()) {
        window.location.href = 'login.html'
        return
    }

    loadUserData();
    await loadFeed();
    loadSuggestions();
    loadUserActivity();
    loadReadingGoal();

    //contador de caracteres
    document.getElementById('postContent').addEventListener('input', updateCharCount);

    //fechar modal ao clicar fora
    document.getElementById('commentsOverlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeComments();
    });
});

// ––– CARREGAR DADOS DO UTILIZADOR ––––––
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    currentUser = user;

    //nav avatar
    const navAvatar = document.getElementById('navAvatar');
    if (user.profile_image) {
        navAvatar.innerHTML = `<img src="${API}/${user.profile_image}" alt="${user.name}">`;
    } else {
        navAvatar.textContent = user.name.charAt(0).toUpperCase();
    }

    //avatar do criar post
    const createAvatar = document.getElementById('createAvatar');
    if (user.profile_image) {
        createAvatar.innerHTML = `<img src="${API}/${user.profile_image}" alt="${user.name}">`;
    } else {
        createAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
}

//–––CONTADOR DE CARACTERES ––––––––
function updateCharCount(){
    const content = document.getElementById('postContent').value;
    const count = document.getElementById('charCount');
    const len = content.length;

    count.textContent = `${len}/500`;
    count.className = 'char-count';

    if (len > 400) count.classList.add('warn');
    if (len >= 500) count.classList.add('limit');
}

//–––CARREGAR FEED–––––
async function loadFeed() {
    document.getElementById('feedLoading').style.display ='block';
    document.getElementById('feedContainer').style.display ='none';
    document.getElementById('feedEmpty').style.display = 'none';

    try {
        const res = await fetch(`${API}/api/posts/feed`, { headers: authHeader() });
        const data = await res.json();

        document.getElementById('feedLoading').style.display = 'none';

        if (!data.success || !data.data.posts.length) {
            document.getElementById('feedEmpty').style.display = 'block';
            return;
        }

        renderFeed(data.data.posts);

    } catch(err) {
        console.error('Erro ao carregar feed:', err);
        document.getElementById('feedLoading').style.display = 'none';
        showToast('Erro ao carregar feed.', 'error');
    }
}

//––––RENDERIZAR POSTS––––––
function renderFeed(posts) {
    const container = document.getElementById('feedContainer');

    container.innerHTML = posts.map(p => {
        const avatar = p.profile_image
            ? `<img src="${API}/${p.profile_image}" alt="${p.name}">`
            : `<span>${p.name.charAt(0).toUpperCase()}</span>`;

        const date = new Date(p.created_at).toLocaleDateString('pt-PT', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        //Bloco de livro
        const bookBlock = p.book_id ? `
            <div class="post-book">
                <div class="post-book-cover">
                    ${p.book_cover
                        ? `<img src="${p.book_cover}" alt="${p.book_title}">`
                        : `<div class="book-placeholder"></div>`
                    }
                </div>
                <div class="post-book-info">
                    <h4 class="post-book-title">${p.book_title}</h4>
                    <p class="post-book-author">${p.book_author || ''}</p>
                    ${p.rating ? `<div class="post-rating">${renderStars(p.rating)}</div>` : ''}
                </div>
            </div>
        ` : '';

        return `
        <div class="post-card" id="post-${p.post_id}">
            <div class="post-header">
                <div class="post-user">
                    <div class="post-avatar">${avatar}</div>
                    <div class="post-name">${p.name}</div>
                </div>
                <span class="post-date">${date}</span>
            </div>
            ${bookBlock}
            <div class="post-content">${p.content}</div>
            <div class="post-actions">
                <button class="post-action ${p.liked ? 'liked' : ''}" onclick="toggleLike(${p.post_id}, this)">
                    <svg viewBox="0 0 24 24" fill="${p.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span id="likes-${p.post_id}">${p.total_likes}</span>
                </button>
                <button class="post-action" onclick="openComments(${p.post_id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>${p.total_comments}</span>
                </button>
            </div>
        </div>
        `;
    }).join('');

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '1.25rem';
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating;
        html += `<svg class="star ${filled ? 'filled' : ''}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    return html;
}

// ––––TABS–––
let currentTab = 'all';
function switchTab (tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadFeed();
}

// ––––Toggle do criar post –––
function openCreatePost() {
    document.getElementById('createPostCard').style.display = 'block';
    document.getElementById('postContent').focus();
}
function closeCreatePost() {
    document.getElementById('createPostCard').style.display = 'none';
    document.getElementById('postContent').value = '';
    document.getElementById('charCount').textContent = '0/500';
}

// –––CRIAR POST––––––
async function createPost() {
    const content = document.getElementById('postContent').value.trim();
    const btn = document.getElementById('postBtn');

    if (!content) { showToast('Escreve algo primeiro.', 'error'); return; }
    if (content.length > 500) { showToast('O post não pode ter mais de 500 caracteres.', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'A publicar...';

    try{
        const res = await fetch(`${API}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken() 
            },
            body: JSON.stringify({ content }),
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('postContent').value = '';
            document.getElementById('charCount').textContent = '0/500';
            showToast('Post publicado!', 'success');
            await loadFeed();
        } else {
            showToast(data.error || 'Erro ao publicar.', 'error');
        }
    } catch (err) {
        showToast('Não foi possível ligar ao servidor.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Publicar';
    }
}

//––––LIKE––––––
async function toggleLike(postId, btn) {
    try {
        const res = await fetch(`${API}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });
        const data = await res.json();

        if (data.success) {
            const liked = data.data.liked;
            const likesEl = document.getElementById(`likes-${postId}`);
            const currentVal = parseInt(likesEl.textContent);

            likesEl.textContent = liked ? currentVal + 1 : currentVal - 1;
            btn.classList.toggle('liked', liked);
            btn.querySelector('svg').setAttribute('fill', liked ? 'currentColor' : 'none');
        }
    } catch (err) {
        showToast('Erro ao dar like.', 'error');
    }
}

//––––COMENTÁRIOS–––––
async function openComments(postId) {
    currentPostId = postId;
    document.getElementById('commentsList').innerHTML = '<div class="comments-empty">A carregar...</div>';
    document.getElementById('commentContent').value = '';
    document.getElementById('commentsOverlay').classList.add('open');

    try {
        const res  = await fetch(`${API}/api/posts/${postId}/comments`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('commentsList');

        if (!data.success || !data.data.comments.length) {
            list.innerHTML = '<div class="comments-empty">Ainda não há comentários. Sê o primeiro!</div>';
            return;
        }

        list.innerHTML = data.data.comments.map(c => {
            const avatar = c.profile_image
                ? `<img src="${API}/${c.profile_image}" alt="${c.name}">`
                : `<span>${c.name.charAt(0).toUpperCase()}</span>`;

            const date = new Date(c.created_at).toLocaleDateString('pt-PT', {
                day: 'numeric', month: 'short'
            });

            return `
            <div class="comment-item">
                <div class="comment-avatar">${avatar}</div>
                <div class="comment-body">
                    <div class="comment-name">${c.name}</div>
                    <div class="comment-text">${c.comment}</div>
                    <div class="comment-date">${date}</div>
                </div>
            </div>
            `;
        }).join('');

        } catch (err) {
        document.getElementById('commentsList').innerHTML = '<div class="comments-empty">Erro ao carregar comentários.</div>';
    }
}

function closeComments() {
    document.getElementById('commentsOverlay').classList.remove('open');
    currentPostId = null;
}

async function submitComment() {
    const comment = document.getElementById('commentContent').value.trim();
    if (!comment) return;
    if (!currentPostId) return;

    try {
        const res  = await fetch(`${API}/api/posts/${currentPostId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({ comment }),
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('commentContent').value = '';
            await openComments(currentPostId);
            showToast('Comentário adicionado!', 'success');
        } else {
            showToast(data.error || 'Erro ao comentar.', 'error');
        }
    } catch (err) {
        showToast('Não foi possível ligar ao servidor.', 'error');
    }
}

// Sidebar - Sugestões
async function loadSuggestions() {
    const container = document.getElementById('suggestionsList');
    try {
        const res = await fetch(`${API}/api/users/suggestions`, { headers: authHeader() });
        const data = await res.json();
        const users = (data.data?.users || data.users || []).slice(0, 2);

        if (!users.length) {
            container.innerHTML = '<div class="muted-text">Sem sugestões.</div>';
            return;
        }

        container.innerHTML = users.map(u => {
            const avatar = u.profile_image
                ? `<img src="${API}/${u.profile_image}" alt="${u.name}">`
                : `<span>${u.name.charAt(0).toUpperCase()}</span>`;
            return `
                <div class="suggestion-item">
                    <div class="suggestion-user">
                        <div class="suggestion-avatar">${avatar}</div>
                        <div class="suggestion-name">${u.name}</div>
                    </div>
                    <button class="btn-follow" onclick="followUser(${u.user_id || u.id}, this)">Seguir</button>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<div class="muted-text">Erro ao carregar.</div>';
    }
}

async function followUser(userId, btn) {
    try {
        const res = await fetch(`${API}/api/users/${userId}/follow`, {
            method: 'POST',
            headers: authHeader()
        });
        const data = await res.json();
        if (data.success) {
            btn.textContent = 'Seguindo';
            btn.classList.add('following');
            btn.disabled = true;
        }
    } catch (err) {
        showToast('Erro ao seguir.', 'error');
    }
}


//Sidebar - Atividade

async function loadUserActivity() {
    try {
        const res = await fetch(`${API}/api/users/activity`, { headers: authHeader() });
        const data = await res.json();
        if (!data.success) return;
        const a = data.data;
        document.getElementById('followingCount').textContent = a.following_count || 0;
        document.getElementById('reviewCount').textContent = a.reviews_this_month || 0;
        document.getElementById('likesCount').textContent = a.likes_count || 0;
    } catch (err) { }
}

//Sidebar - Desafio
async function loadReadingGoal() {
    try {
        const res = await fetch(`${API}/api/users/reading-goal`, { headers: authHeader() });
        const data = await res.json();
        if (!data.success) return;
        const g = data.data;
        const current = g.current || 0;
        const total = g.goal || 50;
        const percent = Math.min(100, Math.round((current / total) * 100));

        document.getElementById('goalCurrent').textContent = current;
        document.getElementById('goalTotal').textContent = total;
        document.getElementById('goalTotal2').textContent = total;
        document.getElementById('goaldPercent').textContent = percent;
        document.getElementById('progressFill').style.width =  `${percent}%`;
    } catch (err) { }
}

//Load more
function loadMore() {
    showToast('Em breve!', 'success');
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}