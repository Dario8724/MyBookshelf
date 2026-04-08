let currentUser = null
let currentPostId = null

document.addEventListener('DOMContentLoaded', async () =>{
    if (!getToken()) {
        window.location.href = 'login.html'
        return
    }

    loadUserData();
    await loadFeed();

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
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return `
        <div class="post-card" id="post-${p.post_id}">
            <div class="post-header">
                <div class="post-user">
                    <div class="post-avatar">${avatar}</div>
                    <div>
                        <div class="post-name">${p.name}</div>
                        <div class="post-date">${date}</div>
                    </div>
                </div>
            </div>
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

// ── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    requestAnimationFrame(() => { requestAnimationFrame(() => el.classList.add('show')); });
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}