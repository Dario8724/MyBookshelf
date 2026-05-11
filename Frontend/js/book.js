let currentBookId = null;
let currentGoogleId = null;
let currentBook = null;
let currentStatus = null;
let isFavorite = false;
let userScore = 0;
let showSpoilers = false;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  updateNavAvatar();

  const params = new URLSearchParams(window.location.search);
  currentBookId = params.get("id");
  currentGoogleId = params.get("google_id");

  if (!currentBookId && !currentGoogleId) {
    showError();
    return;
  }

  await loadBook();
});

// ===== NAV AVATAR =====
function updateNavAvatar() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const nav = document.getElementById("navAvatar");
  if (!nav) return;

  if (user.profile_image) {
    nav.innerHTML = `<img src="${API}/${user.profile_image}" alt="${user.name}">`;
  } else {
    nav.textContent = user.name.charAt(0).toUpperCase();
  }
}

// ===== BACK =====
function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "search.html";
  }
}

// ===== LOAD BOOK =====
async function loadBook() {
  try {
    const url = currentBookId
      ? `${API}/api/books/${currentBookId}`
      : `${API}/api/books/google/${encodeURIComponent(currentGoogleId)}`;

    const res = await fetch(url, { headers: authHeader() });
    const data = await res.json();

    if (!data.success) {
      showError();
      return;
    }

    currentBook = data.data.book;

    // Se veio pelo google_id, garantir que existe na BD para obter o book_id
    if (!currentBook.book_id && currentGoogleId) {
      try {
        const saveRes = await fetch(`${API}/api/books/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({ google_id: currentGoogleId }),
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          currentBookId = saveData.data.book_id;
          currentBook.book_id = currentBookId;
        }
      } catch (err) {
        console.error("Erro ao guardar livro na BD:", err);
      }
    } else if (currentBook.book_id) {
      currentBookId = currentBook.book_id;
    }

    renderBook();

    // Mostrar conteúdo
    document.getElementById("pageLoading").style.display = "none";
    document.getElementById("bookContent").style.display = "block";

    // Carregar dados extra em paralelo
    await Promise.all([
      loadStatus(),
      loadRatingAndReviews(),
      loadUserRating(),
      loadReviews(),
      loadFriendsReading(),
    ]);
  } catch (err) {
    console.error("Erro ao carregar livro:", err);
    showError();
  }
}

function showError() {
  document.getElementById("pageLoading").style.display = "none";
  document.getElementById("bookContent").style.display = "block";
  document.getElementById("heroCard").style.display = "none";
  document.getElementById("bookError").style.display = "block";
}

// ===== RENDER BOOK =====
function renderBook() {
  const b = currentBook;
  document.title = `MyBookshelf - ${b.title}`;

  // Capa
  const coverEl = document.getElementById("bookCover");
  if (b.cover) {
    coverEl.src = b.cover;
    coverEl.alt = b.title;
  } else {
    coverEl.style.display = "none";
  }

  // Tags: editora e ano
  const tags = [];
  if (b.publisher) tags.push(b.publisher);
  if (b.publication_year) tags.push(b.publication_year);

  const tagsEl = document.getElementById("heroTags");
  tagsEl.innerHTML = tags
    .map((t) => `<span class="hero-tag">${escapeHtml(t)}</span>`)
    .join("");

  // Título e autor
  document.getElementById("bookTitle").textContent = b.title;
  document.getElementById("bookAuthor").textContent =
    b.author || "Autor desconhecido";

  // Sinopse — remove HTML que vem da API
  const synopsisEl = document.getElementById("bookSynopsis");
  if (b.description) {
    synopsisEl.textContent = stripHtml(b.description);
    synopsisEl.classList.remove("empty");
  } else {
    synopsisEl.textContent = "Sem sinopse disponível para este livro.";
    synopsisEl.classList.add("empty");
  }
}

// ===== STATUS =====
async function loadStatus() {
  if (!currentBookId) {
    renderProgress(null);
    return;
  }

  try {
    const res = await fetch(`${API}/api/library/${currentBookId}/status`, {
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success && data.data.status) {
      currentStatus = data.data.status;
      isFavorite = !!data.data.favorite;
      renderProgress(data.data);
    } else {
      currentStatus = null;
      isFavorite = false;
      renderProgress(null);
    }

    updateStatusButtons();
  } catch (err) {
    console.error("Erro ao carregar status:", err);
  }
}

function updateStatusButtons() {
  // Status buttons
  document.querySelectorAll(".btn-status[data-status]").forEach((btn) => {
    if (btn.dataset.status === currentStatus) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Favorite
  const favBtn = document.getElementById("btnFavorite");
  if (isFavorite) {
    favBtn.classList.add("active");
  } else {
    favBtn.classList.remove("active");
  }
}

async function setStatus(status) {
  if (!currentBookId) {
    showToast("Erro: livro não disponível.", "error");
    return;
  }

  // Se clicar no que já está ativo, remove da biblioteca
  if (currentStatus === status) {
    await removeFromLibrary();
    return;
  }

  try {
    const res = await fetch(`${API}/api/library`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ book_id: currentBookId, status }),
    });
    const data = await res.json();

    if (data.success) {
      currentStatus = status;
      updateStatusButtons();
      showToast(statusLabel(status) + "!", "success");
    } else {
      showToast(data.error || "Erro ao atualizar.", "error");
    }
  } catch (err) {
    showToast("Erro ao ligar ao servidor.", "error");
  }
}

async function removeFromLibrary() {
  try {
    const res = await fetch(`${API}/api/library/${currentBookId}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success) {
      currentStatus = null;
      isFavorite = false;
      updateStatusButtons();
      showToast("Removido da biblioteca.", "success");
    }
  } catch (err) {
    showToast("Erro ao remover.", "error");
  }
}

function statusLabel(status) {
  return (
    {
      reading: "A ler",
      completed: "Lido",
      want_to_read: "Quero ler",
    }[status] || status
  );
}

// ===== FAVORITE =====
async function toggleFavorite() {
  if (!currentBookId) {
    showToast("Adiciona o livro à biblioteca primeiro.", "error");
    return;
  }

  if (!currentStatus) {
    // Se ainda não está na biblioteca, adiciona como "want_to_read" primeiro
    await setStatus("want_to_read");
  }

  try {
    const res = await fetch(`${API}/api/library/${currentBookId}/favorite`, {
      method: "POST",
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success) {
      isFavorite = data.data.favorite;
      updateStatusButtons();
      showToast(
        isFavorite ? "Adicionado aos favoritos!" : "Removido dos favoritos.",
        "success",
      );
    }
  } catch (err) {
    showToast("Erro ao atualizar favorito.", "error");
  }
}

// ===== RATING + REVIEWS COUNT =====
async function loadRatingAndReviews() {
  if (!currentBookId) return;

  try {
    // Rating médio
    const rRes = await fetch(`${API}/api/ratings/${currentBookId}`, {
      headers: authHeader(),
    });
    const rData = await rRes.json();

    if (rData.success && rData.data.average_score) {
      document.getElementById("ratingValue").textContent =
        rData.data.average_score;
    } else {
      document.getElementById("ratingValue").textContent = "—";
    }

    // Total reviews
    const revRes = await fetch(`${API}/api/reviews/book/${currentBookId}`, {
      headers: authHeader(),
    });
    const revData = await revRes.json();

    if (revData.success) {
      const total = revData.data.total_reviews || 0;
      document.getElementById("reviewsValue").textContent = formatNumber(total);
    }
  } catch (err) {
    console.error("Erro ao carregar rating/reviews:", err);
  }
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

// ===== UTILS =====
function escapeHtml(text) {
  if (text == null) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  document.getElementById("toastContainer").appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add("show"));
  });
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// ===== PROGRESSO =====
function renderProgress(data) {
  const container = document.getElementById("progressContent");
  if (!container) return;

  // Não está na biblioteca
  if (!data || !data.status) {
    container.innerHTML = `
            <div class="progress-empty">
                <p>Adiciona à biblioteca para começar a registar o teu progresso.</p>
            </div>
        `;
    return;
  }

  // Want to read — sem progresso ainda
  if (data.status === "want_to_read") {
    container.innerHTML = `
            <div class="progress-empty">
                <p>Quando começares a ler, regista aqui o teu progresso.</p>
                <button class="btn-progress" onclick="openProgressModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Começar a ler
                </button>
            </div>
        `;
    return;
  }

  // Reading ou completed
  const current = data.current_page || 0;
  const total = data.total_pages || null;

  if (!total) {
    // Falta definir total
    container.innerHTML = `
            <div class="progress-empty">
                <p>Define o total de páginas para acompanhar o teu progresso.</p>
                <button class="btn-progress" onclick="openProgressModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Definir páginas
                </button>
            </div>
        `;
    return;
  }

  const percent = Math.round((current / total) * 100);
  const isCompleted = data.status === "completed" || percent >= 100;

  container.innerHTML = `
        <div class="progress-display">
            <div class="progress-numbers">
                <span class="progress-percent">${percent}%</span>
                <span class="progress-pages">pág. ${current}/${total}</span>
            </div>
            <div class="progress-bar-wrap">
                <div class="progress-bar-fill ${isCompleted ? "completed" : ""}" style="width:${percent}%"></div>
            </div>
            <button class="btn-progress" onclick="openProgressModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Atualizar progresso
            </button>
        </div>
    `;
}

// ===== MODAL =====
async function openProgressModal() {
  if (!currentBookId) return;

  // Buscar valores atuais
  try {
    const res = await fetch(`${API}/api/library/${currentBookId}/status`, {
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById("currentPageInput").value =
        data.data.current_page || "";
      document.getElementById("totalPagesInput").value =
        data.data.total_pages || "";
    }
  } catch (err) {
    /* ignore */
  }

  document.getElementById("progressMsg").textContent = "";
  document.getElementById("progressOverlay").classList.add("open");
}

function closeProgressModal() {
  document.getElementById("progressOverlay").classList.remove("open");
}

async function saveProgress() {
  const currentPage = parseInt(
    document.getElementById("currentPageInput").value,
    10,
  );
  const totalPages = parseInt(
    document.getElementById("totalPagesInput").value,
    10,
  );
  const msg = document.getElementById("progressMsg");

  msg.textContent = "";

  if (isNaN(totalPages) || totalPages < 1) {
    msg.textContent = "Define um total de páginas válido.";
    return;
  }

  if (isNaN(currentPage) || currentPage < 0) {
    msg.textContent = "Define uma página atual válida.";
    return;
  }

  if (currentPage > totalPages) {
    msg.textContent = "A página atual não pode ser maior que o total.";
    return;
  }

  try {
    const res = await fetch(`${API}/api/library/${currentBookId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        current_page: currentPage,
        total_pages: totalPages,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      msg.textContent = data.error || "Erro ao atualizar.";
      return;
    }

    closeProgressModal();

    // Atualizar UI
    currentStatus = data.data.status;
    updateStatusButtons();
    renderProgress({
      status: data.data.status,
      current_page: data.data.current_page,
      total_pages: data.data.total_pages,
      favorite: isFavorite,
    });

    if (data.data.auto_completed) {
      showToast("🎉 Livro marcado como lido!", "success");
    } else {
      showToast("Progresso atualizado.", "success");
    }
  } catch (err) {
    msg.textContent = "Erro ao ligar ao servidor.";
  }
}

// Fechar modal ao clicar fora
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("progressOverlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeProgressModal();
    });
  }
});

// ===== RATING (estrelas) =====
const ratingLabels = {
  1: "Não gostei",
  2: "Razoável",
  3: "Gostei",
  4: "Muito bom",
  5: "Excelente",
};

function renderStars(score, hover = false) {
  const buttons = document.querySelectorAll(".star-btn");
  buttons.forEach((btn, i) => {
    const filled = i < score;
    btn.classList.toggle(hover ? "hover" : "active", filled);
    if (!hover) btn.classList.remove("hover");
  });
}

function hoverRating(score) {
  if (score === 0) {
    // saiu do hover — voltar ao valor real
    document
      .querySelectorAll(".star-btn")
      .forEach((btn) => btn.classList.remove("hover"));
    document.getElementById("ratingLabel").textContent = userScore
      ? ratingLabels[userScore]
      : "";
    return;
  }
  document.querySelectorAll(".star-btn").forEach((btn, i) => {
    btn.classList.toggle("hover", i < score);
  });
  document.getElementById("ratingLabel").textContent = ratingLabels[score];
}

async function setRating(score) {
  if (!currentBookId) {
    showToast("Adiciona o livro à biblioteca primeiro.", "error");
    return;
  }

  try {
    const res = await fetch(`${API}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ book_id: currentBookId, score }),
    });
    const data = await res.json();

    if (data.success) {
      userScore = score;
      renderStars(score);
      document.getElementById("ratingLabel").textContent = ratingLabels[score];
      showToast(`Avaliação guardada: ${score}/5`, "success");

      // Atualizar a média no hero
      if (data.data.average_score) {
        document.getElementById("ratingValue").textContent =
          data.data.average_score;
      }
    } else {
      showToast(data.error || "Erro ao avaliar.", "error");
    }
  } catch (err) {
    showToast("Erro ao ligar ao servidor.", "error");
  }
}

// ===== USER RATING (carregar avaliação existente) =====
async function loadUserRating() {
  if (!currentBookId) return;

  try {
    const res = await fetch(`${API}/api/ratings/${currentBookId}`, {
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success && data.data.user_score) {
      userScore = data.data.user_score;
      renderStars(userScore);
      document.getElementById("ratingLabel").textContent =
        ratingLabels[userScore];
    }
  } catch (err) {
    console.error("Erro ao carregar avaliação:", err);
  }
}

// ===== REVIEWS =====
async function loadReviews() {
  if (!currentBookId) return;

  const list = document.getElementById("reviewsList");

  try {
    const res = await fetch(`${API}/api/reviews/book/${currentBookId}`, {
      headers: authHeader(),
    });
    const data = await res.json();

    if (!data.success || !data.data.reviews.length) {
      list.innerHTML =
        '<p class="reviews-empty">Ainda não há reviews. Sê o primeiro!</p>';
      return;
    }

    list.innerHTML = data.data.reviews.map((r) => renderReviewItem(r)).join("");
  } catch (err) {
    console.error("Erro ao carregar reviews:", err);
    list.innerHTML = '<p class="reviews-empty">Erro ao carregar reviews.</p>';
  }
}

function renderReviewItem(r) {
  const avatar = r.profile_image
    ? `<img src="${API}/${r.profile_image}" alt="${escapeHtml(r.name)}">`
    : `<span>${(r.name || "U").charAt(0).toUpperCase()}</span>`;

  const date = formatReviewDate(r.created_at);
  const score = parseInt(r.score) || 0;
  const stars = renderInlineStars(score);

  const spoilerTag = r.has_spoiler
    ? `
        <div class="review-spoiler-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Contém spoilers
        </div>
    `
    : "";

  const content =
    r.has_spoiler && !showSpoilers
      ? `<div class="review-hidden">🚫 Esta review contém spoilers. Ativa o botão "Mostrar spoilers" para ver.</div>`
      : `<div class="review-text">${escapeHtml(r.review_text)}</div>`;

  return `
        <div class="review-item">
            <div class="review-head">
                <div class="review-user">
                    <div class="review-avatar">${avatar}</div>
                    <div class="review-user-info">
                        <span class="review-name">${escapeHtml(r.name)}</span>
                        <span class="review-date">${date}</span>
                    </div>
                </div>
                ${score > 0 ? `<div class="review-stars">${stars}</div>` : ""}
            </div>
            ${spoilerTag}
            ${content}
        </div>
    `;
}

function renderInlineStars(score) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    const filled = i <= score;
    html += `<svg class="${filled ? "" : "empty"}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
  return html;
}

function formatReviewDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toggleSpoilers() {
  showSpoilers = !showSpoilers;
  const btn = document.getElementById("toggleSpoilersBtn");
  const text = document.getElementById("toggleSpoilersText");
  btn.classList.toggle("active", showSpoilers);
  text.textContent = showSpoilers ? "Esconder spoilers" : "Mostrar spoilers";
  loadReviews();
}

// ===== SUBMETER REVIEW =====
async function submitReview() {
  if (!currentBookId) {
    showToast("Adiciona o livro à biblioteca primeiro.", "error");
    return;
  }

  const content = document.getElementById("reviewContent").value.trim();
  const hasSpoiler = document.getElementById("spoilerCheck").checked;
  const btn = document.getElementById("publishReviewBtn");

  if (!content) {
    showToast("Escreve algo primeiro.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "A publicar...";

  try {
    const res = await fetch(`${API}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({
        book_id: currentBookId,
        review_text: content,
        has_spoiler: hasSpoiler ? 1 : 0,
      }),
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById("reviewContent").value = "";
      document.getElementById("spoilerCheck").checked = false;
      showToast("Review publicada!", "success");
      await loadReviews();
      await loadRatingAndReviews(); // refresh count no hero
    } else {
      showToast(data.error || "Erro ao publicar.", "error");
    }
  } catch (err) {
    showToast("Erro ao ligar ao servidor.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Publicar review";
  }
}

function stripHtml(html) {
  if (!html) return "";

  // Substituir <br>, <p>, </p> por quebras de linha antes de remover tags
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n\n");

  // Usar o browser para decodificar entidades HTML e remover tags restantes
  const div = document.createElement("div");
  div.innerHTML = text;
  text = div.textContent || div.innerText || "";

  // Limpar espaços e quebras excessivas
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// ===== AMIGOS A LER =====
async function loadFriendsReading() {
  if (!currentBookId) return;

  const list = document.getElementById("friendsList");

  try {
    const res = await fetch(
      `${API}/api/library/${currentBookId}/friends-reading`,
      {
        headers: authHeader(),
      },
    );
    const data = await res.json();

    if (!data.success || !data.data.friends.length) {
      list.innerHTML = `<p class="friends-empty">Nenhum dos teus seguidos está a ler este livro.</p>`;
      return;
    }

    list.innerHTML = data.data.friends
      .map((f) => {
        const avatar = f.profile_image
          ? `<img src="${API}/${f.profile_image}" alt="${escapeHtml(f.name)}">`
          : `<span>${(f.name || "U").charAt(0).toUpperCase()}</span>`;

        const statusText =
          f.percent !== null
            ? `<span class="friend-status percent">${f.percent}% lido</span>`
            : `<span class="friend-status">A ler</span>`;

        return `
                <div class="friend-item">
                    <div class="friend-avatar">${avatar}</div>
                    <div class="friend-info">
                        <span class="friend-name">${escapeHtml(f.name)}</span>
                        ${statusText}
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (err) {
    console.error("Erro ao carregar amigos:", err);
    list.innerHTML = `<p class="friends-empty">Erro ao carregar amigos.</p>`;
  }
}
