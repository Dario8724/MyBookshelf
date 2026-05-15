let currentClubId = null;
let isMember = false;
let currentTab = 'messages';
let allClubs = [];
let map = null;
let marker = null;
let autocomplete = null;
let mainMap = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }
    loadUserData();
    await loadClubs();

    document.getElementById('createOverlay').addEventListener('click', e => {
        if (e.target === e.currentTarget) closeCreateModal();
    });
});

// ── UTILIZADOR ────────────────────────────────────────────
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    const navAvatar = document.getElementById('navAvatar');
    if (user.profile_image) {
        navAvatar.innerHTML = `<img src="${API}/${user.profile_image}" alt="${user.name}">`;
    } else {
        navAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
}

// ── CARREGAR CLUBES ───────────────────────────────────────
async function loadClubs() {
    document.getElementById('clubsLoading').style.display = 'block';
    document.getElementById('clubsList').style.display = 'none';
    document.getElementById('clubsEmpty').style.display = 'none';

    try {
        const res = await fetch(`${API}/api/clubs`, { headers: authHeader() });
        const data = await res.json();

        document.getElementById('clubsLoading').style.display = 'none';

        if (!data.success || !data.data.clubs.length) {
            document.getElementById('clubsEmpty').style.display = 'flex';
            loadGoogleMapsMain();
            return;
        }

        allClubs = data.data.clubs;
        renderClubs(allClubs);
        loadGoogleMapsMain();

    } catch (err) {
        document.getElementById('clubsLoading').style.display = 'none';
        showToast('Erro ao carregar clubes.', 'error');
    }
}

// ── RENDERIZAR LISTA ──────────────────────────────────────
function renderClubs(clubs) {
    const colors = ['#E91E63', '#9C27B0', '#2196F3', '#FF9800', '#4CAF50', '#795548', '#F44336', '#607D8B'];
    const container = document.getElementById('clubsList');

    container.innerHTML = clubs.map((club, i) => {
        const color = colors[i % colors.length];
        return `
        <div class="club-card" onclick="showClubDetail(${club.club_id})">
            <div class="club-card-top">
                <div class="club-avatar" style="background:${color}">${club.name.charAt(0)}</div>
                <div class="club-card-info">
                    <div class="club-card-name">${club.name}</div>
                    <div class="club-card-meta">${club.total_members} membros</div>
                </div>
            </div>
            <div class="club-card-desc">${club.description}</div>
            <div class="club-card-footer">
                <div class="club-card-members">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    ${club.created_by_name}
                </div>
                <span class="btn btn-outline" style="font-size:0.8rem;padding:0.35rem 0.75rem">Ver clube</span>
            </div>
        </div>
        `;
    }).join('');

    document.getElementById('mapCount').textContent = `${clubs.length} clubes`;
    document.getElementById('clubsList').style.display = 'flex';
    document.getElementById('clubsList').style.flexDirection = 'column';
    document.getElementById('clubsList').style.gap = '0.75rem';
}

// ── MOSTRAR DETALHE ───────────────────────────────────────
async function showClubDetail(clubId) {
    currentClubId = clubId;
    document.getElementById('viewMain').style.display = 'none';
    document.getElementById('viewDetail').style.display = 'flex';

    try {
        const res = await fetch(`${API}/api/clubs/${clubId}`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success) { showToast('Clube não encontrado.', 'error'); return; }

        const club = data.data.club;
        isMember = club.is_member;

        document.getElementById('detailAvatar').textContent = club.name.charAt(0);
        document.getElementById('detailName').textContent = club.name;
        document.getElementById('detailDesc').textContent = club.description;
        document.getElementById('detailMembers').textContent = `${club.member_count} membros`;

        updateMemberBtn();
        switchTab('messages');
        loadRanking();
        renderSidebar(club);

    } catch (err) {
        showToast('Erro ao carregar clube.', 'error');
    }
}

function showMainView() {
    document.getElementById('viewDetail').style.display = 'none';
    document.getElementById('viewMain').style.display = 'flex';
    currentClubId = null;
}

// ── TABS ──────────────────────────────────────────────────
function switchTab(tab) {
    currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
    });

    document.getElementById(`tab-${tab}`).style.display = 'block';

    if (tab === 'messages') loadMessages();
    if (tab === 'members') loadMembers();
    if (tab === 'voting') renderVoting();
    if (tab === 'library') renderLibrary();
    if (tab === 'sessions') renderSessions();
}

// ── MEMBERSHIP ────────────────────────────────────────────
function updateMemberBtn() {
    const btn = document.getElementById('memberBtn');
    if (isMember) {
        btn.textContent = 'Sair';
        btn.style.background = 'var(--muted)';
        btn.style.borderColor = 'var(--muted)';
    } else {
        btn.textContent = 'Juntar-se';
        btn.style.background = 'var(--accent)';
        btn.style.borderColor = 'var(--accent)';
    }
}

async function toggleMembership() {
    if (!currentClubId) return;

    const endpoint = isMember
        ? `${API}/api/clubs/${currentClubId}/leave`
        : `${API}/api/clubs/${currentClubId}/join`;

    try {
        const res = await fetch(endpoint, { method: 'POST', headers: authHeader() });
        const data = await res.json();

        if (data.success) {
            isMember = !isMember;
            updateMemberBtn();
            showToast(isMember ? 'Entraste no clube!' : 'Saíste do clube.', 'success');
            switchTab(currentTab);

            const res2 = await fetch(`${API}/api/clubs/${currentClubId}`, { headers: authHeader() });
            const data2 = await res2.json();
            if (data2.success) {
                document.getElementById('detailMembers').textContent = `${data2.data.club.member_count} membros`;
            }
        } else {
            showToast(data.error || 'Erro.', 'error');
        }
    } catch (err) {
        showToast('Erro de ligação.', 'error');
    }
}

// ── MENSAGENS ─────────────────────────────────────────────
async function loadMessages() {
    const locked = document.getElementById('messagesLocked');
    const list = document.getElementById('messagesList');
    const input = document.getElementById('messageInput');

    if (!isMember) {
        locked.style.display = 'flex';
        list.style.display = 'none';
        input.style.display = 'none';
        return;
    }

    locked.style.display = 'none';
    list.style.display = 'flex';
    input.style.display = 'flex';

    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/messages`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success || !data.data.messages.length) {
            list.innerHTML = '<div style="color:var(--muted);font-size:0.875rem;text-align:center;padding:2rem">Ainda não há mensagens. Sê o primeiro!</div>';
            return;
        }

        list.innerHTML = data.data.messages.map(m => {
            const avatar = m.profile_image
                ? `<img src="${API}/${m.profile_image}" alt="${m.name}">`
                : `<span>${m.name.charAt(0).toUpperCase()}</span>`;

            const time = new Date(m.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            return `
            <div class="message-item">
                <div class="message-avatar">${avatar}</div>
                <div class="message-body">
                    <div class="message-meta">
                        <span class="message-name">${m.name}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${m.message}</div>
                </div>
            </div>
            `;
        }).join('');

        list.scrollTop = list.scrollHeight;

    } catch (err) {
        list.innerHTML = '<div style="color:var(--muted);font-size:0.875rem;text-align:center;padding:2rem">Erro ao carregar mensagens.</div>';
    }
}

async function sendMessage() {
    const content = document.getElementById('msgContent').value.trim();
    if (!content || !currentClubId) return;

    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/messages`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ message: content })
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('msgContent').value = '';
            await loadMessages();
        } else {
            showToast(data.error || 'Erro ao enviar.', 'error');
        }
    } catch (err) {
        showToast('Erro de ligação.', 'error');
    }
}

// ── MEMBROS ───────────────────────────────────────────────
async function loadMembers() {
    try {
        const res = await fetch(`${API}/api/clubs/${currentClubId}/members`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success) return;

        const members = data.data.members;
        document.getElementById('detailMembers').textContent = `${members.length} membros`;
        document.getElementById('membersCount').textContent = `${members.length} membros ativos`;

        document.getElementById('membersList').innerHTML = members.length ? members.map(m => {
            const avatar = m.profile_image
                ? `<img src="${API}/${m.profile_image}" alt="${m.name}">`
                : `<span>${m.name.charAt(0).toUpperCase()}</span>`;
            return `
            <div class="member-card">
                <div class="member-avatar">${avatar}</div>
                <div class="member-info">
                    <div class="member-name">${m.name}</div>
                    <div class="member-role">${m.role === 'admin' ? 'Administrador' : 'Membro'}</div>
                </div>
            </div>`;
        }).join('') : '<div style="color:var(--muted);text-align:center;padding:2rem;grid-column:1/-1">Ainda não há membros.</div>';

    } catch (err) {
        showToast('Erro ao carregar membros.', 'error');
    }
}

// ── SESSÕES ───────────────────────────────────────────────
function renderSessions() {
    document.getElementById('sessionsList').innerHTML = `
        <div style="color:var(--muted);text-align:center;padding:3rem;font-size:0.875rem">
            Ainda não há sessões agendadas.
        </div>`;
}

// ── VOTAÇÕES ──────────────────────────────────────────────
function renderVoting() {
    const locked = document.getElementById('votingLocked');
    const list = document.getElementById('votingList');

    if (!isMember) {
        locked.style.display = 'flex';
        list.style.display = 'none';
        return;
    }

    locked.style.display = 'none';
    list.style.display = 'block';
    list.innerHTML = `
        <div style="color:var(--muted);text-align:center;padding:3rem;font-size:0.875rem">
            Ainda não há votações ativas.
        </div>`;
}

// ── BIBLIOTECA ────────────────────────────────────────────
function renderLibrary() {
    document.getElementById('libraryGrid').innerHTML = `
        <div style="color:var(--muted);text-align:center;padding:3rem;font-size:0.875rem;grid-column:1/-1">
            Ainda não há livros na biblioteca do clube.
        </div>`;
}

// ── RANKING ───────────────────────────────────────────────
async function loadRanking() {
    try {
        const res = await fetch(`${API}/api/clubs/ranking`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success) return;

        const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
        const list = data.data.clubs || [];

        document.getElementById('rankingList').innerHTML = list.map((club, i) => `
            <div class="rank-card">
                <div class="rank-position" style="background:${colors[i] || 'var(--surface2)'}">
                    ${i + 1}
                </div>
                <div class="rank-avatar">${club.name.charAt(0)}</div>
                <div class="rank-info">
                    <div class="rank-name">${club.name}</div>
                    <div class="rank-type">Clube de leitura</div>
                </div>
                <div class="rank-points">
                    ${club.points || club.total_members}
                    <span>pontos</span>
                </div>
            </div>
        `).join('');

    } catch (err) {
        document.getElementById('rankingList').innerHTML = '<div style="color:var(--muted);text-align:center;padding:2rem">Sem dados de ranking.</div>';
    }
}

// ── SIDEBAR ───────────────────────────────────────────────
function renderSidebar(club) {
    document.getElementById('sidebarBook').innerHTML = `
        <div class="sidebar-book-cover" style="display:flex;align-items:center;justify-content:center;font-size:3rem">📖</div>
        <div class="sidebar-book-title">Livro do mês</div>
        <div class="sidebar-book-author">A definir pelos membros</div>
        <div class="stars">★★★★☆</div>
    `;
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0% dos membros já terminaram';
}

// ── MAPA PRINCIPAL ────────────────────────────────────────
function initMainMap(clubs) {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        document.getElementById('mapPlaceholder').style.display = 'none';

        mainMap = new google.maps.Map(document.getElementById('mapMarkers'), {
            center: { lat, lng },
            zoom: 13,
            styles: [
                { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#EDE8DC' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D4CBBA' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F5F0E8' }] },
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            ],
            disableDefaultUI: true,
            zoomControl: true,
        });

        // marcador da posição do utilizador
        new google.maps.Marker({
            position: { lat, lng },
            map: mainMap,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#2196F3',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
            },
            title: 'A tua localização'
        });

        // marcadores dos clubes
        const colors = ['#E91E63', '#9C27B0', '#2196F3', '#FF9800', '#4CAF50', '#795548'];
        clubs.forEach((club, i) => {
            if (!club.latitude || !club.longitude) return;

            const clubMarker = new google.maps.Marker({
                position: { lat: parseFloat(club.latitude), lng: parseFloat(club.longitude) },
                map: mainMap,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: colors[i % colors.length],
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                },
                title: club.name
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="font-family:Inter,sans-serif;padding:0.5rem">
                        <strong style="font-family:'Playfair Display',serif">${club.name}</strong>
                        <p style="font-size:0.8rem;color:#8A8070;margin-top:0.2rem">${club.total_members} membros</p>
                    </div>`
            });

            clubMarker.addListener('click', () => {
                infoWindow.open(mainMap, clubMarker);
                showClubDetail(club.club_id);
            });
        });
    });
}

async function loadGoogleMapsMain() {
    try {
        const res = await fetch(`${API}/api/config/maps`, { headers: authHeader() });
        const data = await res.json();
        if (!data.success || !data.data.key) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.data.key}&libraries=places&callback=mapsReady`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    } catch (err) {
        console.error('Erro ao carregar Maps:', err);
    }
}

window.mapsReady = function () {
    initMainMap(allClubs);
};

// ── GOOGLE MAPS (modal criar clube) ───────────────────────
async function loadGoogleMaps() {
    try {
        const res = await fetch(`${API}/api/config/maps`, { headers: authHeader() });
        const data = await res.json();

        if (!data.success || !data.data.key) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.data.key}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

    } catch (err) {
        console.error('Erro ao carregar Google Maps:', err);
    }
}

function initMap() {
    document.getElementById('mapLoading').style.display = 'none';

    map = new google.maps.Map(document.getElementById('createMap'), {
        center: { lat: 38.7169, lng: -9.1399 },
        zoom: 13,
        styles: [
            { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#EDE8DC' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D4CBBA' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#F5F0E8' }] },
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
    });

    map.addListener('click', (e) => {
        placeMarker(e.latLng.lat(), e.latLng.lng());
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
    });

    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('locationSearch'),
        { types: ['geocode'], componentRestrictions: { country: 'pt' } }
    );

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        map.setCenter({ lat, lng });
        map.setZoom(15);
        placeMarker(lat, lng);
        setLocationText(place.formatted_address);
    });
}

function placeMarker(lat, lng) {
    if (marker) marker.setMap(null);

    marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#C07B3A',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
        }
    });

    document.getElementById('clubLat').value = lat;
    document.getElementById('clubLng').value = lng;
}

function reverseGeocode(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
            setLocationText(results[0].formatted_address);
        }
    });
}

function setLocationText(text) {
    document.getElementById('locationText').textContent = text;
    document.getElementById('locationSelected').style.display = 'flex';
    document.getElementById('locationSearch').value = text;
}

function clearLocation() {
    if (marker) marker.setMap(null);
    marker = null;
    document.getElementById('clubLat').value = '';
    document.getElementById('clubLng').value = '';
    document.getElementById('locationSearch').value = '';
    document.getElementById('locationSelected').style.display = 'none';
}

function useMyLocation() {
    if (!navigator.geolocation) {
        showToast('Geolocalização não suportada.', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (map) {
            map.setCenter({ lat, lng });
            map.setZoom(15);
            placeMarker(lat, lng);
            reverseGeocode(lat, lng);
        }
    }, () => {
        showToast('Não foi possível obter a localização.', 'error');
    });
}

// ── MODAL ─────────────────────────────────────────────────
function openCreateModal() {
    document.getElementById('createOverlay').classList.add('open');
    if (!map) {
        if (typeof google !== 'undefined') {
            initMap();
        } else {
            loadGoogleMaps();
        }
    } else {
        setTimeout(() => google.maps.event.trigger(map, 'resize'), 100);
    }
}

function closeCreateModal() {
    document.getElementById('createOverlay').classList.remove('open');
    document.getElementById('clubName').value = '';
    document.getElementById('clubDesc').value = '';
    clearLocation();
}

// ── CRIAR CLUBE ───────────────────────────────────────────
async function createClub() {
    const name = document.getElementById('clubName').value.trim();
    const description = document.getElementById('clubDesc').value.trim();
    const latitude = document.getElementById('clubLat').value || null;
    const longitude = document.getElementById('clubLng').value || null;

    if (!name) { showToast('O nome é obrigatório.', 'error'); return; }
    if (!description) { showToast('A descrição é obrigatória.', 'error'); return; }

    try {
        const res = await fetch(`${API}/api/clubs`, {
            method: 'POST',
            headers: authHeader(),
            body: JSON.stringify({ name, description, latitude, longitude })
        });
        const data = await res.json();

        if (data.success) {
            closeCreateModal();
            showToast('Clube criado com sucesso!', 'success');
            await loadClubs();
        } else {
            showToast(data.error || 'Erro ao criar clube.', 'error');
        }
    } catch (err) {
        showToast('Erro de ligação.', 'error');
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