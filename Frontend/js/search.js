let selectedBook = null;

const featuredBooks = [
    {
        title: 'O Pequeno Príncipe',
        author: 'Antoine de Saint-Exupéry',
        google_id: '_NTSEAAAQBAJ',
        cover: 'http://books.google.com/books/content?id=_NTSEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    },
    {
        title: 'O Diário de Anne Frank',
        author: 'Anne Frank',
        google_id: 'Z2OyCwAAQBAJ',
        cover: 'http://books.google.com/books/content?id=Z2OyCwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    },
    {
        title: 'Orgulho e Preconceito',
        author: 'Jane Austen',
        google_id: 'UGIC7N0Op2MC',
        cover: 'http://books.google.com/books/content?id=UGIC7N0Op2MC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    },
    {
        title: '1984',
        author: 'George Orwell',
        google_id: 'EKgWEAAAQBAJ',
        cover: 'http://books.google.com/books/content?id=EKgWEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    },
    {
        title: 'Cem Anos de Solidão',
        author: 'Gabriel García Márquez',
        google_id: 'ZfjpEAAAQBAJ',
        cover: 'http://books.google.com/books/content?id=ZfjpEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    },
    {
        title: 'Dom Casmurro',
        author: 'Machado de Assis',
        google_id: 'qmE0EQAAQBAJ',
        cover: 'http://books.google.com/books/content?id=qmE0EQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = 'login.html'
        return
    }

    updateNavAvatar();
    renderFeatured();

    //Restaura pesquisa anterior
    const lastQuery = sessionStorage.getItem('lastSearchQuery');
    const lastResults = sessionStorage.getItem('lastSearchResults');
    const cameFromBook = sessionStorage.getItem('cameFromBook');

    sessionStorage.removeItem('cameFromBook');

    if (lastQuery && lastResults && cameFromBook === 'true') {
        document.getElementById('searchInput').value = lastQuery;
        document.getElementById('searchEmpty').style.display = 'none';
        const data = JSON.parse(lastResults);
        renderResults(data.books, data.total);
    } else {
        sessionStorage.removeItem('lastSearchQuery');
        sessionStorage.removeItem('lastSearchResults');
    }

    //pesquisa ao pressionar Enter
    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') doSearch();
    });

    document.getElementById('addOverlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeAddModal();
    });
});

// –––– RENDERIZAR LIVROS EM DESTAQUE –––––
function renderFeatured() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    grid.innerHTML = featuredBooks.map(book => `
        <div class="book-card" onclick="sessionStorage.setItem('cameFromBook','true'); window.location.href='book.html?google_id=${encodeURIComponent(book.google_id)}'">
            <div class="book-cover-wrap">
                <img src="${book.cover}" alt="${book.title}" class="book-cover" loading="lazy">
                <button class="book-add-btn" title="Adicionar à biblioteca" onclick="event.stopPropagation(); openAddModal(${JSON.stringify(book).replace(/"/g, '&quot;')})">+</button>
            </div>
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
        </div>
    `).join('');
}

// –– ATUALIZA AVATAR DA NAV ––––––
function updateNavAvatar() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const nav = document.getElementById('navAvatar');
    if (!nav) return;

    if (user.profile_image) {
        nav.innerHTML = `<img src="${API}/${user.profile_image}" alt="${user.name}">`;
    } else {
        nav.textContent = user.name.charAt(0).toUpperCase();
    }
}

// –– PESQUISAR ––––––
async function doSearch(){
    const query = document.getElementById('searchInput').value.trim();

    if (!query) return;

    //Guarda a query no sessionStorage
    sessionStorage.setItem('lastSearchQuery', query);

    document.getElementById('searchEmpty').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchLoading').style.display = 'block';

    try{
        const res = await fetch(`${API}/api/books/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        document.getElementById('searchLoading').style.display = 'none';

        if (!data.success || !data.data.books.length) {
            document.getElementById('searchEmpty').style.display = 'block';
            document.getElementById('searchEmpty').innerHTML = `
                <div class="empty-icon">📭</div>
                <p>Nenhum livro encontrado para "<strong>${query}</strong>"</p>
            `;
            sessionStorage.removeItem('lastSearchQuery');
            sessionStorage.removeItem('lastSearchResults');
            return;
        }

        //Guarda os resultados no sessionStorage
        sessionStorage.setItem('lastSearchResults', JSON.stringify(data.data));

        renderResults(data.data.books, data.data.total);

    } catch (err) {
        console.error('Erro na pesquisa:', err);
        document.getElementById('searchLoading').style.display = 'none';
        showToast('Erro ao pesquisar livros.', 'error');
    }
}

// –––– RENDERIZAR RESULTADOS –––––
function renderResults(books, total) {
    document.getElementById('resultsHeader').textContent = `${total} livros encontrados`;

    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = books.map(book => `
        <div class="book-card" onclick="sessionStorage.setItem('cameFromBook', 'true'); window.location.href='book.html?google_id=${encodeURIComponent(book.google_id)}'">
            <div class="book-cover-wrap">
                ${book.cover
                    ? `<img src="${book.cover}" alt="${book.title}" class="book-cover" loading="lazy">`
                    : `<div class="book-cover-placeholder">📖</div>`
                }
                <button class="book-add-btn" title="Adicionar à biblioteca" onclick="event.stopPropagation(); openAddModal(${JSON.stringify(book).replace(/"/g, '&quot;')})">+</button>
            </div>
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
        </div>
    `).join('');

    document.getElementById('searchResults').style.display = 'block';
}

// –––––– MODAL ADICIONAR ––––––
function openAddModal(book) {
    selectedBook = book;

    document.getElementById('modalBookInfo').innerHTML = `
        ${book.cover
            ? `<img src="${book.cover}" alt="${book.title}">`
            : `<div style="width:50px;height:75px;background:var(--surface2);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">📖</div>`
        }
        <div>
            <div class="modal-book-title">${book.title}</div>
            <div class="modal-book-author">${book.author}</div>
        </div>
    `;

    document.getElementById('addOverlay').classList.add('open');
}

function closeAddModal() {
    document.getElementById('addOverlay').classList.remove('open');
    selectedBook = null;
}

// –––– ADICIONAR À BIBLIOTECA –––––
async function addToLibrary(status) {
    if (!selectedBook) return;

    try{
        //1 Guarda o livro na BD
        const saveRes = await fetch(`${API}/api/books/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({ google_id: selectedBook.google_id }),
        });
        const saveData = await saveRes.json();

        if (!saveData.success) {
            showToast('Erro ao guardar o livro.', 'error');
        }

        const bookId = saveData.data.book_id;

        //2 Adiciona à biblioteca do utilizador
        const libRes = await fetch(`${API}/api/library`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getToken()
            },
            body: JSON.stringify({ book_id: bookId, status }),
        });
        const libData = await libRes.json();
        
        if (libData.success) {
            closeAddModal();
            showToast('Livro adicionado à biblioteca!', 'success');

            //Verifica conquistas
            await fetch(`${API}/api/achievements/check`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });

        } else {
            showToast(libData.error || 'Erro ao adicionar à biblioteca.', 'erorr');
        }

    } catch (err) {
        console.error('Erro:', err);
        showToast('Não foi possível ligar ao servidor.', 'erorr');
    }
}

// ––––– TOAST –––––––
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
document.getElementById('addOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAddModal();
});