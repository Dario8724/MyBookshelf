let currentBookId = null;
let currentGoogleId = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  //Lê o book_id ou google_id da URL
  const params = new URLSearchParams(window.location.search);
  currentBookId = params.get("id");
  currentGoogleId = params.get("google_id");

  if (!currentBookId && !currentGoogleId) {
    document.getElementById("book-details").innerHTML =
      "<p>Livro não encontrado.</p>";
    return;
  }

  await loadBook();
});

// ––––– CARREGAR O LIVRO ––––
async function loadBook() {
    try {
        let url;
        if (currentBookId) {
            url = `${API}/api/books/${currentBookId}`;
        } else {
            url = `${API}/api/books/google/${encodeURIComponent(currentGoogleId)}`;
        }

        const res  = await fetch(url, { headers: authHeader() });
        const data = await res.json();

        if (!data.success) {
            document.getElementById('bookContainer').innerHTML = '<p>Livro não encontrado.</p>';
            return;
        }

        const book = data.data.book;

        // Guarda o book_id para usar nas outras funções
        if (book.book_id) currentBookId = book.book_id;

        renderBook(book);
        await loadStatus();
        await loadRating();
        await loadReviews();

        document.getElementById('ratingSection').style.display = 'block';
        document.getElementById('reviewSection').style.display = 'block';

    } catch (err) {
        console.error('Erro ao carregar livro:', err);
        document.getElementById('bookContainer').innerHTML = '<p>Erro ao carregar livro.</p>';
    }
}

// –––RENDERIZAR LIVRO–––
function renderBook(book) {
  document.title = `MyBookshelf - ${book.title}`;

  document.getElementById("bookContainer").innerHTML = `
        <div style="display:flex; gap:2rem; align-items:flex-start;">
            ${
              book.cover
                ? `<img src="${book.cover}" alt="${book.title}" style="width:180px; border-radius:8px">`
                : `<div style="width:180px;height:270px;background:#eee;display:flex;align-items:center;justify-content:center">📖</div>`
            }
            <div>
                <h1>${book.title}</h1>
                <h3>${book.author || "Autor desconhecido"}</h3>
                ${book.publication_year ? `<p>📅 ${book.publication_year}</p>` : ""}
                ${book.publisher ? `<p>🏢 ${book.publisher}</p>` : ""}
                ${book.isbn ? `<p>ISBN: ${book.isbn}</p>` : ""}
                ${book.description ? `<p style="max-width:600px;line-height:1.6">${book.description}</p>` : ""}

                <div id="libraryStatus" style="margin-top:1rem;"></div>
            </div>
        </div>
    `;
}

//––––ESTADO NA BIBLIOTECA ––––
async function loadStatus() {
  if (!currentBookId) return;

  try {
    const res = await fetch(`${API}/api/library/${currentBookId}/status`, {
      headers: authHeader(),
    });
    const data = await res.json();

    const statuEl = document.getElementById("libraryStatus");

    if (data.success && data.data.status) {
      const statusLabel = {
        reading: "A ler",
        completed: "Lido",
        want_to_read: "Quero ler",
      };

      statuEl.innerHTML = `
                <p>📚 Status: <strong>${statusLabel[data.data.status] || data.data.status}</strong></p>
                <select onchange="changeStatus(this.value)">
                    <option value="">Mudar status</option>
                    <option value="want_to_read">Quero ler</option>
                    <option value="reading">A ler</option>
                    <option value="completed">Lido</option>
                </select>
                <button onclick="removeFromLibrary()">Remover da biblioteca</button>
            `;
    } else {
      statuEl.innerHTML = `
                <p>Este livro não está na sua biblioteca.</p>
                <select onchange="addToLibrary(this.value)">
                    <option value="">Adicionar à biblioteca</option>
                    <option value="want_to_read">Quero ler</option>
                    <option value="reading">A ler</option>
                    <option value="completed">Lido</option>
                </select>
            `;
    }
  } catch (err) {
    console.error("Erro ao carregar status:", err);
  }
}

// –––ADICIONAR À BIBLIOTECA –––
async function addToLibrary(status) {
  if (!status || !currentBookId) return;

  try {
    const res = await fetch(`${API}/api/library`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ book_id: currentBookId, status }),
    });
    const data = await res.json();

    if (data.success) {
      await loadStatus();
      alert("Livro adicionado à biblioteca!");
    } else {
      alert(data.error || "Erro ao adicionar");
    }
  } catch (err) {
    alert("Erro ao ligar ao servidor.");
  }
}

//—–––MUDAR ESTADO–––––
async function changeStatus(status) {
  if (!status || !currentBookId) return;

  try {
    const res = await fetch(`${API}/api/library`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ book_id: currentBookId, status }),
    });
    const data = await res.json();

    if (data.success) {
      await loadStatus();
    } else {
      alert(data.error || "Erro ao atualizar");
    }
  } catch (err) {
    alert("Erro ao ligar ao servidor.");
  }
}

// –––REMOVER DA BIBLIOTECA –––
async function removeFromLibrary() {
  if (!confirm("Tens a certeza que queres remover este livro?")) return;

  try {
    const res = await fetch(`${API}/api/library/${currentBookId}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success) {
      await loadStatus();
      alert("Livro removido da biblioteca!");
    } else {
      alert(data.error || "Erro ao remover");
    }
  } catch (err) {
    alert("Erro ao ligar ao servidor.");
  }
}

//––––––AVALIAÇÃO––––
async function loadRating() {
  if (!currentBookId) return;

  try {
    const res = await fetch(`${API}/api/ratings?book_id=${currentBookId}`, {
      headers: authHeader(),
    });
    const data = await res.json();

    if (data.success && data.data.user_score) {
      highlightStars(data.data.user_score);
      document.getElementById("ratingMsg").textContent =
        `A tua avaliação: ${data.data.user_score}/5`;
    }

    //Mostra média
    if (data.data.average_score) {
      document.getElementById("ratingMsg").textContent +=
        ` | Média: ${parseFloat(data.data.average_score).toFixed(1)}/5 (${data.data.total_ratings} avaliações)`;
    }
  } catch (err) {
    console.error("Erro ao carregar avaliação:", err);
  }
}

async function rate(score) {
  if (!currentBookId) return;

  try {
    const res = await fetch(`${API}/api/ratings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ book_id: currentBookId, score }),
    });
    const data = await res.json();

    if (data.success) {
      highlightStars(score);
      document.getElementById("ratingMsg").textContent =
        `Avaliação guardada: ${score}/5`;
    }
  } catch (err) {
    console.error('Erro ao avaliar.');
  }
}

function highlightStars(score) {
    const stars = document.querySelectorAll('#starRating span');
    stars.forEach((star, i) => {
        star.style.color = i < score ? 'gold' : 'gray';
        star.style.fontSize = '2rem';
        star.style.cursor = 'pointer';
    });
}

//––––––REVIEWS––––
async function loadReviews() {
    if (!currentBookId) return;

    try {
        const res = await fetch(`${API}/api/reviews/book/${currentBookId}`, { headers: authHeader() });
        const data = await res.json();

        const list = document.getElementById('reviewsList');

        if (!data.success || data.data.reviews.length) {
            list.innerHTML = '<h3>Reviews</h3><p>Ainda não há reviews. Sê o primeiro!</p>';
            return;
        }

        list.innerHTML = '<h3>Reviews (' + data.data.total + ')</h3>' +
            data.data.reviews.map(r => `
                <strong>${r.name}</strong>
                    <span style="color:gold">${'★'.repeat(r.score || 0)}</span>
                    ${r.has_spoiler ? '<span style="color:red">[SPOILER]</span>' : ''}
                    <p>${r.review_text}</p>
                    <small>${new Date(r.created_at).toLocaleDateString('pt-PT')}</small>
                </div>
            `).join('');

    } catch (err) {
        console.error('Erro ao carregar reviews:', err);
    }
}

async function submitReview() {
    if (!currentBookId) return;

    const content = document.getElementById('reviewContent').value.trim();
    const hasSpoiler = document.getElementById('hasSpoiler').checked;
    const msg = document.getElementById('reviewMsg');

    if (!content) { msg.textContent = 'Escreve algo primeiro.'; return; }

    try {
        const res = await fetch(`${API}/api/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() },
            body: JSON.stringify({ 
                book_id: currentBookId, 
                review_text: content, 
                has_spoiler: hasSpoiler ? 1 : 0,
            }),
        });
        const data = await res.json();

        if (data.success) {
            document.getElementById('reviewContent').value = '';
            document.getElementById('hasSpoiler').checked = false;
            msg.textContent = 'Review submetida!';
            await loadReviews();
        } else {
            msg.textContent = data.error || 'Erro ao submeter review.';
        }
    } catch (err) {
        msg.textContent = 'Erro ao ligar ao servidor.';
    }
}