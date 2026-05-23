const TMDB_API_KEY = 'TMDB_API_KEY_PLACEHOLDER';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRE_HORROR = 27;
const GENRE_ROMANCE = 10749;
const GENRE_ANIMATION = 16;

const LATIN_SCRIPT_LANGS = 'pt|en|es|fr|it|de|nl|sv|no|da|pl|ro|ca|tr|vi';

const filmeModal = new bootstrap.Modal(document.getElementById('filme-modal'));
const limiteModal = new bootstrap.Modal(document.getElementById('limite-modal'));

const FETCH_LIMIT = 5;
const FETCH_COUNT_KEY = 'fetch-count';

async function fetchRandomMovie() {
    const excludeHorror = document.getElementById('excluir-terror').checked;
    const excludeRomCom = document.getElementById('excluir-comedia').checked;
    const excludeAdult = document.getElementById('excluir-adulto').checked;
    const excludeLowRating = document.getElementById('excluir-nota').checked;
    const excludeAnimation = document.getElementById('excluir-animacao').checked;
    const onlyRecent = document.getElementById('apenas-recentes').checked;
    const hardcoreMode = document.getElementById('modo-hardcore').checked;

    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
        include_adult: excludeAdult ? 'false' : 'true',
        sort_by: 'popularity.desc',
    });

    const withoutGenres = [];
    if (excludeHorror) withoutGenres.push(GENRE_HORROR);
    if (excludeRomCom) withoutGenres.push(GENRE_ROMANCE);
    if (excludeAnimation) withoutGenres.push(GENRE_ANIMATION);
    if (withoutGenres.length) params.set('without_genres', withoutGenres.join(','));

    if (excludeLowRating) {
        params.set('vote_average.gte', '7');
        params.set('vote_count.gte', '100');
    }

    if (!hardcoreMode) {
        params.set('with_original_language', LATIN_SCRIPT_LANGS);
    }

    let minDate = null;
    if (onlyRecent) {
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        minDate = tenYearsAgo.toISOString().slice(0, 10);
        params.set('release_date.gte', minDate);
    }

    const firstRes = await fetch(`${TMDB_BASE}/discover/movie?${params}&page=1`);
    if (!firstRes.ok) throw new Error(`TMDB error: ${firstRes.status}`);
    const firstData = await firstRes.json();

    // TMDB caps at 500 pages, 20 results per page
    const totalPages = Math.min(firstData.total_pages, 500);
    if (totalPages === 0) throw new Error('Nenhum filme encontrado com esses filtros.');

    // Try up to 5 random pages — TMDB filters leak old films at high pages, so re-roll if page yields nothing valid
    for (let attempt = 0; attempt < 5; attempt++) {
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        params.set('page', randomPage);

        const pageRes = await fetch(`${TMDB_BASE}/discover/movie?${params}`);
        if (!pageRes.ok) throw new Error(`TMDB error: ${pageRes.status}`);
        const pageData = await pageRes.json();

        let movies = pageData.results;
        if (minDate) movies = movies.filter(m => m.release_date && m.release_date >= minDate);
        if (movies.length) return movies[Math.floor(Math.random() * movies.length)];
    }

    throw new Error('Nenhum filme encontrado com esses filtros.');
}

function renderMovie(movie) {
    document.getElementById('filme-titulo').textContent = movie.title;

    const anoEl = document.getElementById('filme-ano');
    anoEl.textContent = movie.release_date?.slice(0, 4) ?? '';
    anoEl.classList.toggle('d-none', !movie.release_date);

    const notaEl = document.getElementById('filme-nota');
    if (movie.vote_average) {
        notaEl.textContent = `${movie.vote_average.toFixed(1)} / 10`;
        notaEl.classList.remove('d-none');
    } else {
        notaEl.classList.add('d-none');
    }

    const posterCol = document.getElementById('filme-poster-col');
    const poster = document.getElementById('filme-poster');
    if (movie.poster_path) {
        poster.src = `${IMG_BASE}${movie.poster_path}`;
        posterCol.classList.remove('d-none');
    } else {
        posterCol.classList.add('d-none');
    }

    document.getElementById('filme-sinopse').textContent = movie.overview || 'Sem sinopse disponível.';
}

function setButtonLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.innerHTML = loading
        ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Buscando...`
        : label;
}

async function buscar(btn, label) {
    const count = Number(sessionStorage.getItem(FETCH_COUNT_KEY) || 0);
    if (count >= FETCH_LIMIT) {
        filmeModal.hide();
        limiteModal.show();
        return;
    }

    setButtonLoading(btn, true, label);
    try {
        const movie = await fetchRandomMovie();
        sessionStorage.setItem(FETCH_COUNT_KEY, count + 1);
        renderMovie(movie);
        filmeModal.show();
    } catch (err) {
        alert(`Erro ao buscar filme: ${err.message}`);
        console.error(err);
    } finally {
        setButtonLoading(btn, false, label);
    }
}

document.getElementById('btn-buscar').addEventListener('click', function () {
    buscar(this, 'Buscar filme');
});

document.getElementById('btn-buscar-outro').addEventListener('click', function () {
    buscar(this, 'Buscar outro');
});
