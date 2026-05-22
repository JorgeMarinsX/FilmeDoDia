const TMDB_API_KEY = 'TMDB_API_KEY_PLACEHOLDER';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

const GENRE_HORROR = 27;
const GENRE_ROMANCE = 10749;

async function fetchRandomMovie() {
    const excludeHorror = document.getElementById('excluir-terror').checked;
    const excludeRomCom = document.getElementById('excluir-comedia').checked;
    const excludeAdult = document.getElementById('excluir-adulto').checked;
    const excludeLowRating = document.getElementById('excluir-nota').checked;

    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'pt-BR',
        include_adult: excludeAdult ? 'false' : 'true',
        sort_by: 'popularity.desc',
    });

    const withoutGenres = [];
    if (excludeHorror) withoutGenres.push(GENRE_HORROR);
    if (excludeRomCom) withoutGenres.push(GENRE_ROMANCE);
    if (withoutGenres.length) params.set('without_genres', withoutGenres.join(','));

    if (excludeLowRating) {
        params.set('vote_average.gte', '7');
        params.set('vote_count.gte', '100');
    }

    const firstRes = await fetch(`${TMDB_BASE}/discover/movie?${params}&page=1`);
    if (!firstRes.ok) throw new Error(`TMDB error: ${firstRes.status}`);
    const firstData = await firstRes.json();

    // TMDB caps at 500 pages, 20 results per page
    const totalPages = Math.min(firstData.total_pages, 500);
    if (totalPages === 0) throw new Error('Nenhum filme encontrado com esses filtros.');

    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    params.set('page', randomPage);

    const pageRes = await fetch(`${TMDB_BASE}/discover/movie?${params}`);
    if (!pageRes.ok) throw new Error(`TMDB error: ${pageRes.status}`);
    const pageData = await pageRes.json();

    const movies = pageData.results;
    return movies[Math.floor(Math.random() * movies.length)];
}

function renderMovie(movie) {
    document.getElementById('filme-titulo').textContent = movie.title;
    document.getElementById('filme-ano').textContent = movie.release_date?.slice(0, 4) ?? '';
    document.getElementById('filme-sinopse').textContent = movie.overview || 'Sem sinopse disponível.';

    const poster = document.getElementById('filme-poster');
    if (movie.poster_path) {
        poster.src = `${IMG_BASE}${movie.poster_path}`;
        poster.classList.remove('d-none');
    } else {
        poster.classList.add('d-none');
    }

    document.getElementById('filme-card').classList.remove('d-none');
}

document.getElementById('btn-buscar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-buscar');
    btn.disabled = true;
    btn.textContent = 'Buscando...';

    try {
        const movie = await fetchRandomMovie();
        renderMovie(movie);
    } catch (err) {
        alert(`Erro ao buscar filme: ${err.message}`);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Buscar filme';
    }
});
