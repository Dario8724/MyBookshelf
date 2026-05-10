let selectedBook = null;
let currentGenre = '';

// ===== LIVROS EM DESTAQUE =====
const featuredBooks = [
    { title: 'Orgulho e Preconceito',        author: 'Jane Austen',                   google_id: '8yE2EQAAQBAJ',  genre: 'Romance Clássico' },
    { title: 'O Morro dos Ventos Uivantes',  author: 'Emily Brontë',                  google_id: 'Eg0zEAAAQBAJ',  genre: 'Romance Clássico' },
    { title: 'Cem Anos de Solidão',          author: 'Gabriel García Márquez',        google_id: 'MAqQDwAAQBAJ',  genre: 'Realismo Mágico' },
    { title: 'Como Água para Chocolate',     author: 'Laura Esquivel',                google_id: '6MCJDwAAQBAJ',  genre: 'Realismo Mágico' },
    { title: '1984',                         author: 'George Orwell',                 google_id: 'EKgWEAAAQBAJ',  genre: 'Ficção Política' },
    { title: 'A Revolução dos Bichos',       author: 'George Orwell',                 google_id: 'JWNqEAAAQBAJ',  genre: 'Ficção Política' },
    { title: 'O Mundo de Sofia',             author: 'Jostein Gaarder',               google_id: 'canMEQAAQBAJ',  genre: 'Ficção Filosófica' },
    { title: 'O Estrangeiro',                author: 'Albert Camus',                  google_id: '2-MCwQEACAAJ',  genre: 'Ficção Filosófica' },
    { title: 'Madame Bovary',                author: 'Gustave Flaubert',              google_id: 'LSOpDwAAQBAJ',  genre: 'Realismo' },
    { title: 'Os Maias',                     author: 'Eça de Queirós',                google_id: 'vArxV11o8FQC',  genre: 'Realismo' },
    { title: 'Os Pilares da Terra',          author: 'Ken Follett',                   google_id: 'oWPMEQAAQBAJ',  genre: 'Romance Histórico' },
    { title: 'Mensagem',                     author: 'Fernando Pessoa',               google_id: 'vadGSohK5gMC',  genre: 'Poesia' },
    { title: 'O Pequeno Príncipe',           author: 'Antoine de Saint-Exupéry',      google_id: '_NTSEAAAQBAJ',  genre: 'Ficção' },
    { title: 'O Amor nos Tempos do Cólera',  author: 'Gabriel García Márquez',        google_id: 'UlfdFb3ohAIC',  genre: 'Romance' },
    { title: 'Drácula',                      author: 'Bram Stoker',                   google_id: 'HoApEAAAQBAJ',  genre: 'Terror' },
    { title: 'O Processo',                   author: 'Franz Kafka',                   google_id: 'xSv3DwAAQBAJ',  genre: 'Ficção Absurdista' },
    { title: 'O Código Da Vinci',            author: 'Dan Brown',                     google_id: 'aPtzEQAAQBAJ',  genre: 'Suspense' },
    { title: 'Admirável Mundo Novo',         author: 'Aldous Huxley',                 google_id: 'FfX-AgAAQBAJ',  genre: 'Distopia' },
    { title: 'O Senhor dos Anéis',           author: 'J.R.R. Tolkien',                google_id: 'fWd6EAAAQBAJ',  genre: 'Fantasia' },
    { title: 'E Não Sobrou Nenhum',          author: 'Agatha Christie',               google_id: 'OanwAwAAQBAJ',  genre: 'Mistério' },
    { title: 'Flores para Algernon',         author: 'Daniel Keyes',                  google_id: 'KBdiDwAAQBAJ',  genre: 'Ficção Científica' },
];

// Adiciona a URL da capa a cada livro
featuredBooks.forEach(b => {
    b.cover = `http://books.google.com/books/content?id=${b.google_id}&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api`;
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    updateNavAvatar();
    renderFeatured();
    setupGenreChips();

    // Restaura pesquisa anterior
    const lastQuery = sessionStorage.getItem('lastSearchQuery');
    const lastResults = sessionStorage.getItem('lastSearchResults');
    const cameFromBook = sessionStorage.getItem('cameFromBook');

    sessionStorage.removeItem('cameFromBook');

    if (lastQuery && lastResults && cameFromBook === 'true') {
        document.getElementById('searchInput').value = lastQuery;
        showSearchMode();
        const data = JSON.parse(lastResults);
        renderResults(data.books, data.total);
    } else {
        sessionStorage.removeItem('lastSearchQuery');
        sessionStorage.removeItem('lastSearchResults');
    }

    // Pesquisa ao pressionar Enter
    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') doSearch();
    });

    // Limpar pesquisa quando o input for esvaziado
    document.getElementById('searchInput').addEventListener('input', e => {
        if (e.target.value.trim() === '') {
            backToFeatured();
        }
    });

    document.getElementById('addOverlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeAddModal();
    });
});

// ===== AVATAR NAV =====
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

// ===== GENRE CHIPS =====
function setupGenreChips() {
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentGenre = chip.dataset.genre;
            renderFeatured();
        });
    });
}

// ===== RENDER FEATURED =====
function renderFeatured() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;

    // Filtrar pelos livros do género atual (ou todos)
    const books = currentGenre
        ? featuredBooks.filter(b => b.genre === currentGenre)
        : featuredBooks;

    if (books.length === 0) {
        grid.innerHTML = `
            <div class="no-results" style="grid-column:1/-1">
                <div class="empty-icon">📭</div>
                <p>Nenhum livro nesta categoria.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = books.map(book => bookCardHTML(book)).join('');
}

// ===== BOOK CARD HTML =====
function bookCardHTML(book) {
    const bookJson = JSON.stringify(book).replace(/"/g, '&quot;');
    const cover = book.cover
        ? `<img src="${book.cover}" alt="${book.title}" class="book-cover" loading="lazy">`
        : `<div class="book-cover-placeholder">📖</div>`;

    return `
        <div class="book-card" onclick="sessionStorage.setItem('cameFromBook','true'); window.location.href='book.html?google_id=${encodeURIComponent(book.google_id)}'">
            <div class="book-cover-wrap">
                ${cover}
                <button class="book-add-btn" title="Adicionar à biblioteca" onclick="event.stopPropagation(); openAddModal(${bookJson})">+</button>
            </div>
            <div class="book-title">${book.title}</div>
            <div class="book-author">${book.author}</div>
        </div>
    `;
}

// ===== MODOS (FEATURED vs SEARCH) =====
function showSearchMode() {
    document.getElementById('searchEmpty').style.display = 'none';
    document.getElementById('genreChips').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
}

function backToFeatured() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchLoading').style.display = 'none';
    document.getElementById('searchEmpty').style.display = 'block';
    document.getElementById('genreChips').style.display = 'flex';
    sessionStorage.removeItem('lastSearchQuery');
    sessionStorage.removeItem('lastSearchResults');
}

// ===== PESQUISAR =====
async function doSearch() {
    const query = document.getElementById('searchInput').value.trim();

    if (!query) {
        backToFeatured();
        return;
    }

    sessionStorage.setItem('lastSearchQuery', query);

    document.getElementById('searchEmpty').style.display = 'none';
    document.getElementById('genreChips').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchLoading').style.display = 'block';

    try {
        const res = await fetch(`${API}/api/books/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        document.getElementById('searchLoading').style.display = 'none';

        if (!data.success || !data.data.books || !data.data.books.length) {
            document.getElementById('searchResults').style.display = 'block';
            document.getElementById('resultsHeader').innerHTML = '';
            document.getElementById('resultsGrid').innerHTML = `
                <div class="no-results" style="grid-column:1/-1">
                    <div class="empty-icon">📭</div>
                    <p>Nenhum livro encontrado para "<strong>${query}</strong>"</p>
                </div>
            `;
            sessionStorage.removeItem('lastSearchResults');
            return;
        }

        sessionStorage.setItem('lastSearchResults', JSON.stringify(data.data));
        renderResults(data.data.books, data.data.total);

    } catch (err) {
        console.error('Erro na pesquisa:', err);
        document.getElementById('searchLoading').style.display = 'none';
        showToast('Erro ao pesquisar livros.', 'error');
    }
}

// ===== RENDER RESULTS =====
function renderResults(books, total) {
    document.getElementById('resultsHeader').textContent = `${total} livros encontrados`;
    const grid = document.getElementById('resultsGrid');
    grid.innerHTML = books.map(book => bookCardHTML(book)).join('');
    document.getElementById('searchResults').style.display = 'block';
}

// ===== MODAL ADICIONAR =====
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

// ===== ADICIONAR À BIBLIOTECA =====
async function addToLibrary(status) {
    if (!selectedBook) return;

    try {
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
            return;
        }

        const bookId = saveData.data.book_id;

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

            await fetch(`${API}/api/achievements/check`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + getToken() }
            });
        } else {
            showToast(libData.error || 'Erro ao adicionar à biblioteca.', 'error');
        }

    } catch (err) {
        console.error('Erro:', err);
        showToast('Não foi possível ligar ao servidor.', 'error');
    }
}

// ===== TOAST =====
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