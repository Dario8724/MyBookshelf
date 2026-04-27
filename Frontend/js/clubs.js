let currentClubId = null;
let currentClubMember = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }
    await loadClubs();
});

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// --- LISTA DE CLUBES -----
async function loadClubs() {
    try {
        const res = await fetch(`${API}/api/clubs`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('clubsList');

        if (!data.success || !data.data.clubs.length) {
            list.innerHTML = '<h3>Clubes Disponíveis</h3><p>Ainda não há clubes. Cria o primeiro!</p>';
            return;
        }

        list.innerHTML = '<h3>Clubes Disponíveis</h3>' +
            data.data.clubs.map(c => `
                <div style="border:1px solid #ccc;padding:1rem;margin-bottom:0.75rem;border-radius:8px">
                    <strong>${c.name}</strong>
                    <p>${c.description || ''}</p>
                    <small>👥 ${c.total_members || 0} membros</small>
                    <br><br>
                    <button onclick="openClub(${c.club_id})">Ver Clube</button>
                </div>
            `).join('');
    } catch (err) {
        console.error('Erro ao carregar clubes:', err);
    }
}

// --- CRIAR CLUBE ---
function toggleCreateForm() {
    const form = document.getElementById('createForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function createClub() {
    const name = document.getElementById('clubName').value.trim();
    const description = document.getElementById('clubDescription').value.trim();
    const latitude = document.getElementById('clubLat').value;
    const longitude = document.getElementById('clubLng').value;
    const msg = document.getElementById('createMsg');

    if (!name) { msg.textContent = 'O nome do clube é obrigatório.'; return; }

    try {
        const res = await fetch(`${API}/api/clubs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ name, description, latitude, longitude })
        });
        const data = await res.json();

        if (data.success) {
            msg.textContent = 'Clube criado com sucesso!';
            document.getElementById('clubName').value = '';
            document.getElementById('clubDescription').value = '';
            toggleCreateForm();
            await loadClubs();
        } else {
            msg.textContent = data.message || 'Erro ao criar clube.';
        }
    } catch (err) {
        msg.textContent = 'Erro ao ligar ao servidor.';
    }
}

// --- ABRIR CLUBE ---
async function openClub(clubId) {
    currentClubId = clubId;

    try {
        const res  = await fetch(`${API}/api/clubs/${clubId}`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success) return;

        const club = data.data.club;
        currentClubMember = club.is_member || false;

        document.getElementById('clubDetailName').textContent = club.name;
        document.getElementById('clubDetailDesc').textContent = club.description || '';

        const actions = document.getElementById('clubActions');
        if (currentClubMember) {
            actions.innerHTML = `<button onclick="leaveClub()">Sair do Clube</button>`;
        } else {
            actions.innerHTML = `<button onclick="joinClub()">Entrar no Clube</button>`;
        }

        document.getElementById('clubDetail').style.display = 'block';
        document.getElementById('clubsList').style.display = 'none';
        document.getElementById('createSection').style.display = 'none';
        
        showTab('messages');

    } catch (err) {
        console.error('Erro ao abrir clube:', err);
    }
}

function closeClub() {
    currentClubId = null;
    currentClubMember = false;
    document.getElementById('clubDetail').style.display = 'none';
    document.getElementById('clubsList').style.display = 'block';
    document.getElementById('createSection').style.display = 'block';
}

// --- ENTRAR / SAIR ------
async function joinClub() {
    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/join`, {
            method: 'POST',
            headers: authHeader()
        });
        const data = await res.json();

        if (data.success) {
            currentClubMember = true;
            document.getElementById('clubActions').innerHTML =
                `<button onclick="leaveClub()">Sair do Clube</button>`;
            alert('Entraste no clube!');
        } else {
            alert(data.message || 'Erro ao entrar no clube.');
        }
    } catch (err) {
        alert('Erro ao ligar ao servidor.');
    }
}

async function leaveClub() {
    if (!confirm('Tens a certeza que queres sair do clube?')) return;

    try {
        const res  = await fetch(`${API}/api/clubs/${currentClubId}/leave`, {
            method: 'DELETE',
            headers: authHeader(),
        });
        const data = await res.json();

        if (data.success) {
            currentClubMember = false;
            document.getElementById('clubActions').innerHTML =
                `<button onclick="joinClub()">Entrar no Clube</button>`;
            alert('Saíste do clube!');
        } else {
            alert(data.message || 'Erro ao sair do clube.');
        }
    } catch (err) {
        alert('Erro ao ligar ao servidor.');
    }
}

// --- TABS ---
function showTab(tab) {
    const tabs = ['messages', 'sessions', 'votes', 'library', 'ranking'];
    tabs.forEach(t => {
        document.getElementById('tab-' + t).style.display = t === tab ? 'block' : 'none';
    });

    if (tab === 'messages') loadMessages();
    if (tab === 'sessions') loadSessions();
    if (tab === 'votes') loadVotes();
    if (tab === 'library') loadClubLibrary();
    if (tab === 'ranking') loadRanking();
}

// --- MENSAGENS ---
async function loadMessages() {
    try {
        const res  = await fetch(`${API}/api/clubs/${currentClubId}/messages`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('messagesList');

        if (!data.success || !data.data.messages.length) {
            list.innerHTML = '<p>Ainda não há mensagens.</p>';
            return;
        }

        const messages  = data.data.messages;
        const preview   = currentClubMember ? messages : messages.slice(0, 3);

        list.innerHTML = preview.map(m => `
            <div style="margin-bottom:0.75rem">
                <strong>${m.user_name}</strong>
                <p style="margin:0.2rem 0">${m.message}</p>
            </div>
        `).join('');

        if (!currentClubMember && messages.length > 3) {
            list.innerHTML += `
                <div style="text-align:center;padding:1rem;background:var(--surface);border-radius:10px;margin-top:0.75rem">
                    <p style="color:var(--muted);font-size:0.875rem;margin-bottom:0.5rem">
                        🔒 Entra no clube para ver todas as mensagens e participar na conversa.
                    </p>
                    <button onclick="joinClub()" style="padding:0.5rem 1.25rem;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:500">
                        Entrar no Clube
                    </button>
                </div>
            `;
        }

        list.scrollTop = list.scrollHeight;

    } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
    }
}

async function sendMessage() {
    const content = document.getElementById('messageContent').value.trim();
    if (!content) return;

    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ message: content })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('messageContent').value = '';
            await loadMessages();
        }
    } catch (err) {
        alert('Erro ao enviar mensagem.');
    }
}

// --- SESSÕES ----
async function loadSessions() {
    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/sessions`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('sessionsList');

        if (!data.success || !data.data.sessions.length) {
            list.innerHTML = '<p>Ainda não há sessões.</p>';
            return;
        }

        list.innerHTML = data.data.sessions.map(s => `
            <div style="border:1px solid #ccc;padding:0.75rem;margin-bottom:0.5rem;border-radius:6px">
                <strong>${s.title}</strong> - ${s.author}<br>
                <small>📅 ${formatDate(s.start_date)} → ${formatDate(s.end_date)}</small>
                <span style="margin-left:1rem;color:${s.status === 'completed' ? 'green' : 'orange'}">${s.status}</span>
                ${s.status === 'active' ? `<button onclick="completeSession(${s.session_id})">Marcar como concluída</button>` : ''}
            </div>
        `).join('');

    } catch (err) {
        console.error('Erro ao carregar sessões:', err);
    }
}

async function createSession() {
    const bookId    = document.getElementById('sessionBookId').value;
    const startDate = document.getElementById('sessionStart').value;
    const endDate   = document.getElementById('sessionEnd').value;
    const msg       = document.getElementById('sessionMsg');

    if (!bookId || !startDate || !endDate) {
        msg.textContent = 'Preenche todos os campos.';
        return;
    }

    try {
        const res  = await fetch(`${API}/api/clubs/${currentClubId}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ book_id: parseInt(bookId), start_date: startDate, end_date: endDate }),
        });
        const data = await res.json();

        if (data.success) {
            msg.textContent = 'Sessão criada!';
            await loadSessions();
        } else {
            msg.textContent = data.error || 'Erro ao criar sessão.';
        }
    } catch (err) {
        msg.textContent = 'Erro ao ligar ao servidor.';
    }
}

async function completeSession(sessionId) {
    try {
        const res  = await fetch(`${API}/api/clubs/sessions/${sessionId}/complete`, {
            method: 'POST',
            headers: authHeader(),
        });
        const data = await res.json();

        if (data.success) {
            await loadSessions();
        } else {
            alert(data.error || 'Erro ao completar sessão.');
        }
    } catch (err) {
        console.error('Erro ao ligar ao servidor.');
    }
}

// --- VOTAÇÕES ---
async function loadVotes() {
    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/votes`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('votesList');

        if (!data.success || !data.data.votes.length) {
            list.innerHTML = '<p>Ainda não há votações.</p>';
            return;
        }

        list.innerHTML = data.data.votes.map(v => `
            <div style="border:1px solid #ccc;padding:0.75rem;margin-bottom:0.5rem;border-radius:6px">
                <strong>${v.title}</strong>
                <span style="margin-left:1rem;color:${v.status === 'open' ? 'green' : 'gray'}">${v.status}</span>
                <small> · ${v.total_votes} votos</small><br>
                <small>📅 ${v.start_date} → ${v.end_date}</small><br><br>
                ${v.status === 'open' ? `
                    <input type="number" id="optionBook-${v.vote_id}" placeholder="Book ID" style="width:80px">
                    <button onclick="addVoteOption(${v.vote_id})">+ Opção</button>
                    &nbsp;
                    <input type="number" id="castOption-${v.vote_id}" placeholder="Option ID" style="width:80px">
                    <button onclick="castVote(${v.vote_id})">Votar</button>
                ` : ''}
            </div>
        `).join('');

    } catch (err) {
        console.error('Erro ao carregar votações:', err);
    }
}

async function createVote() {
    const title = document.getElementById('voteTitle').value.trim();
    const startDate = document.getElementById('voteStart').value;
    const endDate = document.getElementById('voteEnd').value;
    const msg = document.getElementById('voteMsg');

    if (!title || !startDate || !endDate) {
        msg.textContent = 'Preenche todos os campos.';
        return;
    }

    try {
        const res  = await fetch(`${API}/api/clubs/${currentClubId}/votes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ title, start_date: startDate, end_date: endDate }),
        });
        const data = await res.json();

        if (data.success) {
            msg.textContent = 'Votação criada!';
            document.getElementById('voteTitle').value = '';
            await loadVotes();
        } else {
            msg.textContent = data.error || 'Erro ao criar votação.';
        }
    } catch (err) {
        msg.textContent = 'Erro ao ligar ao servidor.';
    }
}

async function addVoteOption(voteId) {
    const bookId = document.getElementById(`optionBook-${voteId}`).value;
    if (!bookId) return;

    try {
        const res  = await fetch(`${API}/api/clubs/votes/${voteId}/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ book_id: parseInt(bookId) }),
        });
        const data = await res.json();

        if (data.success) {
            alert('Opção adicionada! Option ID: ${data.data.option_id}');
        } else {
            alert(data.error || 'Erro ao adicionar opção.');
        }
    } catch (err) {
        alert('Erro ao ligar ao servidor.');
    }
}

async function castVote(voteId) {
    const optionId = document.getElementById(`castOption-${voteId}`).value;
    if (!optionId) return;

    try {
        const res  = await fetch(`${API}/api/clubs/votes/${voteId}/cast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ option_id: parseInt(optionId) }),
        });
        const data = await res.json();

        if (data.success) {
            alert('Voto registrado!');
            await loadVotes();
        } else {
            alert(data.error || 'Erro ao voto.');
        }
    } catch (err) {
        alert('Erro ao ligar ao servidor.');
    }
}

// –– BIBLIOTECA DO CLUBE ---
async function loadClubLibrary() {
    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/library`, { headers: authHeader() });
        const data = await res.json();
        
        const list = document.getElementById('clubLibraryList');

        if (!data.success || !data.data.books.length) {
            list.innerHTML = '<p>A biblioteca está vazia.<p>';
            return;
        }

        list.innerHTML = data.data.books.map(b => `
            <div style="border:1px solid #ccc;padding:0.75rem;margin-bottom:0.5rem;border-radius:6px">
                <strong>${b.title}</strong> - ${b.author}<br>
                <small style="margin-left:1rem">Adicionado por ${b.added_by_name}</small>
                <button onclick="removeBookFromClub(${b.club_library_id})" style="margin-left:1rem">Remover</button>
            </div>
        `).join('');
    
    } catch (err) {
        console.error('Erro ao carregar biblioteca:', err);
    }
}

async function addBookToClub() {
    const bookId = document.getElementById('libraryBookId').value;
    const msg = document.getElementById('libraryMsg');

    if (!bookId) { msg.textContent = 'Introduz um Book ID.'; return; }

    try {
        const res  = await fetch(`${API}/api/clubs/${currentClubId}/library`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ book_id: parseInt(bookId) }),
        });
        const data = await res.json();

        if (data.success) {
            msg.textContent = 'Livro adicionado!';
            document.getElementById('libraryBookId').value = '';
            await loadClubLibrary();
        } else {
            msg.textContent = data.error || 'Erro ao adicionar livro.';
        }
    } catch (err) {
        msg.textContent = 'Erro ao ligar ao servidor.';
    }
}

async function removeBookFromClub(clubLibraryId) {
    if (!confirm('Remover este livro da biblioteca do clube?')) return;

    try {
        const res  = await fetch(`${API}/api/clubs/library/${clubLibraryId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
            body: JSON.stringify({ club_id: currentClubId }),
        });
        const data = await res.json();

        if (data.success) {
            await loadClubLibrary();
        } else {
            alert(data.error || 'Erro ao remover livro.');
        }
    } catch (err) {
        alert('Erro ao ligar ao servidor.');
    }
}

// ––– RANKING ––––
async function loadRanking() {
    try {
        const res  = await fetch(`${API}/api/clubs/ranking/global`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('rankingList');

        if (!data.success || !data.data.ranking.length) {
            list.innerHTML = '<p>Ainda não há pontos nesta season.</p>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];

        list.innerHTML = `
            <p style="font-size:0.8rem;color:var(--muted);margin-bottom:1rem">
                Season ${data.data.season.season_id} — ${data.data.season.start_date} → ${data.data.season.end_date}
            </p>
            ${data.data.ranking.map((r, i) => `
                <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--border);padding:0.75rem 1rem;margin-bottom:0.5rem;border-radius:10px;background:${r.club_id === currentClubId ? 'var(--surface)' : 'transparent'}">
                    <div style="display:flex;align-items:center;gap:0.75rem">
                        <span style="font-size:1.2rem">${medals[i] || '#' + (i + 1)}</span>
                        <strong style="color:${r.club_id === currentClubId ? 'var(--accent)' : 'var(--text)'}">${r.name}</strong>
                    </div>
                    <span style="font-weight:600;color:var(--accent)">${r.total_points} pts</span>
                </div>
            `).join('')}
        `;

    } catch (err) {
        console.error('Erro ao carregar ranking:', err);
    }
}