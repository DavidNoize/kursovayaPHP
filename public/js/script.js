let currentUser = null;
let moviesData = [];
let currentPage = 1;
let lastPage = 1;
let currentFilters = {};
let selectedGenres = [];
let selectedCountries = [];
let selectedDirectors = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM загружен, загружаем пользователя...');
    
    currentUser = await getCurrentUser();
    console.log('Текущий пользователь:', currentUser);
    
    updateAuthUI();
    
    await loadMoviesData();
    await loadGenres();
    await loadCountries();
    await loadDirectors();
    
    setupEventListeners();
    setupAuthSystem();
    setupFilters();
});

async function loadMoviesData(page = 1, filters = {}) {
    try {
        currentFilters = filters;
        
        const params = new URLSearchParams({
            page: page,
            per_page: 20
        });

        if (filters.search) params.append('search', filters.search);
        if (filters.type) params.append('type', filters.type);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        
        if (selectedGenres.length > 0) {
            params.append('genre', selectedGenres[0]);
        }
        
        if (selectedCountries.length > 0) {
            params.append('country', selectedCountries[0]);
        }
        
        if (selectedDirectors.length > 0) {
            params.append('director', selectedDirectors[0]);
        }

        if (filters.year_from) params.append('year_from', filters.year_from);
        if (filters.year_to) params.append('year_to', filters.year_to);

        const token = getAuthToken();
        const data = await apiRequest(`/movies?${params.toString()}`, 'GET', null, token);
        
        moviesData = data.data;
        lastPage = data.last_page;
        currentPage = data.current_page;
        
        renderCatalog();
        updateResultsInfo(data.total);
        renderPagination();
    } catch (error) {
        console.error('Ошибка загрузки фильмов:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

async function loadGenres() {
    try {
        const genres = await apiRequest('/genres');
        populateGenreFilters(genres);
    } catch (error) {
        console.error('Ошибка загрузки жанров:', error);
    }
}

async function loadCountries() {
    try {
        const countries = await apiRequest('/countries');
        populateCountryFilters(countries);
    } catch (error) {
        console.error('Ошибка загрузки стран:', error);
    }
}

async function loadDirectors() {
    try {
        const data = await apiRequest('/movies?per_page=100');
        const movies = data.data || [];
        
        const directorsMap = new Map();
        movies.forEach(movie => {
            if (movie.directors && movie.directors.length > 0) {
                movie.directors.forEach(director => {
                    if (!directorsMap.has(director.id)) {
                        directorsMap.set(director.id, {
                            id: director.id,
                            name: director.name,
                            count: 1
                        });
                    } else {
                        const existing = directorsMap.get(director.id);
                        existing.count++;
                    }
                });
            }
        });
        
        const directors = Array.from(directorsMap.values());
        populateDirectorFilters(directors);
    } catch (error) {
        console.error('Ошибка загрузки режиссеров:', error);
    }
}

function renderCatalog() {
    const catalog = document.getElementById('catalog-grid');
    if (!catalog) return;
    
    catalog.innerHTML = '';

    if (!moviesData || moviesData.length === 0) {
        catalog.innerHTML = '<p class="no-results">Ничего не найдено</p>';
        return;
    }

    moviesData.forEach(movie => {
        const card = createMovieCard(movie);
        catalog.appendChild(card);
    });
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    card.innerHTML = `
        <div class="movie-poster-container">
            <img src="${movie.poster || 'https://via.placeholder.com/300x450'}" 
                 alt="${movie.title}" 
                 class="movie-poster" 
                 onerror="handleImageError(this)">
            <div class="movie-type-badge">${movie.type === 'movie' ? 'Фильм' : 'Сериал'}</div>
        </div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-rating">${movie.imdb_rating || '?'}</div>
            <svg class="star-icon ${!currentUser ? 'disabled' : ''}" 
                 viewBox="0 0 24 24" data-id="${movie.id}"
                 title="${!currentUser ? 'Войдите, чтобы добавить' : 'Добавить в коллекцию'}">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (!e.target.closest('.star-icon')) {
            openMovieModal(movie.id);
        }
    });

    const star = card.querySelector('.star-icon');
    if (currentUser) {
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCollection(movie.id, star);
        });
        
        checkInCollection(movie.id, star);
    }

    return card;
}

async function checkInCollection(movieId, starElement) {
    try {
        const token = getAuthToken();
        const data = await apiRequest(`/collection/check/${movieId}`, 'GET', null, token);
        if (data.in_collection) {
            starElement.classList.add('active');
            starElement.setAttribute('title', 'В коллекции');
        }
    } catch (error) {
        console.error('Ошибка проверки коллекции:', error);
    }
}

async function toggleCollection(movieId, starElement) {
    try {
        const token = getAuthToken();
        const check = await apiRequest(`/collection/check/${movieId}`, 'GET', null, token);
        
        if (check.in_collection) {
            await apiRequest(`/collection/${movieId}`, 'DELETE', null, token);
            starElement.classList.remove('active');
            starElement.setAttribute('title', 'Добавить в коллекцию');
            showNotification('Удалено из коллекции');
        } else {
            await apiRequest(`/collection/${movieId}`, 'POST', { status: 'wishlist' }, token);
            starElement.classList.add('active');
            starElement.setAttribute('title', 'В коллекции');
            showNotification('Добавлено в коллекцию');
        }
    } catch (error) {
        showNotification('Ошибка при обновлении коллекции', 'error');
    }
}

async function openMovieModal(movieId) {
    try {
        const movie = await apiRequest(`/movies/${movieId}`);
        showMovieModal(movie);
    } catch (error) {
        showNotification('Ошибка загрузки фильма', 'error');
    }
}

function showMovieModal(movie) {
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;

    const genres = movie.genres?.map(g => g.name).join(', ') || '';
    const countries = movie.countries?.map(c => c.name).join(', ') || '';
    
    modalBody.innerHTML = `
        <div class="modal-poster-container">
            <img src="${movie.poster || 'https://via.placeholder.com/300x450'}" 
                 alt="${movie.title}" 
                 class="modal-poster"
                 onerror="handleImageError(this)">
        </div>
        <h2 class="modal-title">${movie.title}</h2>
        <div class="modal-meta">
            <span>${movie.release_year}</span>
            <span>${movie.type === 'movie' ? 'Фильм' : 'Сериал'}</span>
            <span>${genres}</span>
            <span>Рейтинг: ${movie.imdb_rating || '?'}</span>
        </div>
        <p class="modal-description">${movie.description || 'Описание отсутствует'}</p>
        
        <div class="modal-details">
            <div class="detail-item">
                <div class="detail-label">Страна</div>
                <div class="detail-value">${countries || 'Не указана'}</div>
            </div>
            ${movie.type === 'movie' ? `
                <div class="detail-item">
                    <div class="detail-label">Длительность</div>
                    <div class="detail-value">${movie.duration || 'Не указана'} мин</div>
                </div>
            ` : `
                <div class="detail-item">
                    <div class="detail-label">Сезоны</div>
                    <div class="detail-value">${movie.seasons || 'Не указано'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Эпизоды</div>
                    <div class="detail-value">${movie.episodes || 'Не указано'}</div>
                </div>
            `}
        </div>
        
        ${movie.actors?.length ? `
        <div class="cast-section">
            <h3 class="cast-title">Актерский состав</h3>
            <div class="cast-list">
                ${movie.actors.map(actor => `<span class="cast-item">${actor.name}</span>`).join('')}
            </div>
        </div>
        ` : ''}
        
        ${movie.directors?.length ? `
        <div class="cast-section">
            <h3 class="cast-title">Режиссеры</h3>
            <div class="cast-list">
                ${movie.directors.map(director => `<span class="cast-item">${director.name}</span>`).join('')}
            </div>
        </div>
        ` : ''}
    `;

    modal.style.display = 'block';
}

function renderPagination() {
    const catalog = document.getElementById('catalog-grid');
    if (!catalog) return;
    
    const oldPagination = document.querySelector('.pagination');
    if (oldPagination) oldPagination.remove();
    
    if (lastPage <= 1) return;
    
    const pagination = document.createElement('div');
    pagination.className = 'pagination';
    
    if (currentPage > 1) {
        pagination.innerHTML += `<button class="page-btn" data-page="${currentPage - 1}">←</button>`;
    }
    
    for (let i = 1; i <= lastPage; i++) {
        if (
            i === 1 || 
            i === lastPage || 
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            pagination.innerHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pagination.innerHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    if (currentPage < lastPage) {
        pagination.innerHTML += `<button class="page-btn" data-page="${currentPage + 1}">→</button>`;
    }
    
    catalog.parentNode.insertBefore(pagination, catalog.nextSibling);
    
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            loadMoviesData(page, currentFilters);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function updateResultsInfo(total) {
    const resultsInfo = document.getElementById('searchResults');
    if (resultsInfo) {
        resultsInfo.textContent = `Найдено: ${total}`;
    }
}

function populateGenreFilters(genres) {
    const container = document.getElementById('genreFilters');
    if (!container) return;

    container.innerHTML = '';
    genres.forEach(genre => {
        container.innerHTML += `
            <div class="filter-checkbox">
                <input type="checkbox" id="genre-${genre.id}" value="${genre.id}">
                <label for="genre-${genre.id}">${genre.name} <span class="filter-count">${genre.movies_count || 0}</span></label>
            </div>
        `;
    });
}

function populateCountryFilters(countries) {
    const container = document.getElementById('countryFilters');
    if (!container) return;

    container.innerHTML = '';
    countries.forEach(country => {
        container.innerHTML += `
            <div class="filter-checkbox">
                <input type="checkbox" id="country-${country.id}" value="${country.id}">
                <label for="country-${country.id}">${country.name} <span class="filter-count">${country.movies_count || 0}</span></label>
            </div>
        `;
    });
}

function populateDirectorFilters(directors) {
    const container = document.getElementById('directorFilters');
    if (!container) return;

    container.innerHTML = '';
    
    directors.sort((a, b) => a.name.localeCompare(b.name));
    
    directors.forEach(director => {
        container.innerHTML += `
            <div class="filter-checkbox">
                <input type="checkbox" id="director-${director.id}" value="${director.id}">
                <label for="director-${director.id}">${director.name} <span class="filter-count">${director.count}</span></label>
            </div>
        `;
    });
}

function updateAuthUI() {
    console.log('updateAuthUI вызван, currentUser:', currentUser);
    
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'block';
            if (userName) userName.textContent = currentUser.name || 'Пользователь';
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}

function setupAuthSystem() {
    console.log('setupAuthSystem вызван');
    
    const loginBtn = document.querySelector('.btn-login');
    const registerBtn = document.querySelector('.btn-register');
    const logoutBtn = document.getElementById('logoutBtn');
    const myCollectionBtn = document.getElementById('myCollectionBtn');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const closeButtons = document.querySelectorAll('.auth-close');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    console.log('loginBtn:', loginBtn);
    console.log('registerBtn:', registerBtn);
    console.log('loginForm:', loginForm);

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log('Клик по кнопке Войти');
            const modal = document.getElementById('loginModal');
            if (modal) modal.style.display = 'block';
        });
    } else {
        console.error('Кнопка Войти не найдена!');
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            console.log('Клик по кнопке Регистрация');
            const modal = document.getElementById('registerModal');
            if (modal) modal.style.display = 'block';
        });
    } else {
        console.error('Кнопка Регистрация не найдена!');
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            removeAuthToken();
            currentUser = null;
            updateAuthUI();
            showNotification('Вы вышли из системы');
            
            loadMoviesData(1, currentFilters);
        });
    }

    if (myCollectionBtn) {
        myCollectionBtn.addEventListener('click', () => {
            window.location.href = '/collection.html';
        });
    }

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('registerModal').style.display = 'block';
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerModal').style.display = 'none';
            document.getElementById('loginModal').style.display = 'block';
        });
    }

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('loginModal').style.display = 'none';
            document.getElementById('registerModal').style.display = 'none';
        });
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Отправка формы входа');
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const data = await apiRequest('/login', 'POST', { email, password });
                
                setAuthToken(data.token);
                currentUser = data.user;
                
                updateAuthUI();
                
                document.getElementById('loginModal').style.display = 'none';
                
                showNotification('Вход выполнен успешно');
                
                loadMoviesData(1, currentFilters);
                
            } catch (error) {
                showNotification('Неверный email или пароль', 'error');
            }
        });
    } else {
        console.error('Форма входа не найдена!');
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Отправка формы регистрации');
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const passwordConfirmation = document.getElementById('registerConfirmPassword').value;

            if (password !== passwordConfirmation) {
                showNotification('Пароли не совпадают', 'error');
                return;
            }

            try {
                const data = await apiRequest('/register', 'POST', { 
                    name, 
                    email, 
                    password, 
                    password_confirmation: passwordConfirmation 
                });
                
                setAuthToken(data.token);
                currentUser = data.user;
                
                updateAuthUI();
                
                document.getElementById('registerModal').style.display = 'none';
                showNotification('Регистрация успешна');
                
                loadMoviesData(1, currentFilters);
                
            } catch (error) {
                showNotification('Ошибка регистрации', 'error');
            }
        });
    } else {
        console.error('Форма регистрации не найдена!');
    }
}

function setupEventListeners() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
}

function setupFilters() {
    const filterBtn = document.getElementById('filterBtn');
    const filtersDropdown = document.getElementById('filtersDropdown');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const applyFiltersBtn = document.querySelector('.apply-filters');
    const resetFiltersBtn = document.querySelector('.reset-filters');
    const sortOptions = document.querySelectorAll('.sort-option');
    const yearFrom = document.getElementById('yearFrom');
    const yearTo = document.getElementById('yearTo');

    if (filterBtn && filtersDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filtersDropdown.classList.toggle('show');
            filterBtn.classList.toggle('active');
        });
    }

    document.addEventListener('click', (e) => {
        if (filtersDropdown && !filtersDropdown.contains(e.target) && e.target !== filterBtn) {
            filtersDropdown.classList.remove('show');
            if (filterBtn) filterBtn.classList.remove('active');
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            applyFilters();
        }, 300));
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            applyFilters();
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            updateSelectedFilters();
            applyFilters();
            filtersDropdown.classList.remove('show');
            filterBtn.classList.remove('active');
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            resetFilters();
            applyFilters();
            filtersDropdown.classList.remove('show');
            filterBtn.classList.remove('active');
        });
    }

    if (sortOptions) {
        sortOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const sortType = e.target.dataset.sort;
                sortOptions.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                let sortBy, sortOrder;
                switch(sortType) {
                    case 'rating':
                        sortBy = 'rating';
                        sortOrder = 'desc';
                        break;
                    case 'year':
                        sortBy = 'release_year';
                        sortOrder = 'desc';
                        break;
                    case 'title':
                        sortBy = 'title';
                        sortOrder = 'asc';
                        break;
                }
                
                currentFilters.sort_by = sortBy;
                currentFilters.sort_order = sortOrder;
                loadMoviesData(1, currentFilters);
            });
        });
    }
}

function updateSelectedFilters() {
    selectedGenres = [];
    selectedCountries = [];
    selectedDirectors = [];

    document.querySelectorAll('#genreFilters input:checked').forEach(cb => {
        selectedGenres.push(cb.value);
    });

    document.querySelectorAll('#countryFilters input:checked').forEach(cb => {
        selectedCountries.push(cb.value);
    });
    
    document.querySelectorAll('#directorFilters input:checked').forEach(cb => {
        selectedDirectors.push(cb.value);
    });

    const typeMovie = document.getElementById('type-movie');
    const typeSeries = document.getElementById('type-series');
    
    if (typeMovie && typeSeries) {
        if (typeMovie.checked && typeSeries.checked) {
            delete currentFilters.type;
        } else if (typeMovie.checked) {
            currentFilters.type = 'movie';
        } else if (typeSeries.checked) {
            currentFilters.type = 'series';
        } else {
            currentFilters.type = 'none';
        }
    }

    const yearFrom = document.getElementById('yearFrom').value;
    const yearTo = document.getElementById('yearTo').value;
    
    if (yearFrom) currentFilters.year_from = yearFrom;
    else delete currentFilters.year_from;
    
    if (yearTo) currentFilters.year_to = yearTo;
    else delete currentFilters.year_to;
}

function resetFilters() {
    document.querySelectorAll('#genreFilters input, #countryFilters input, #directorFilters input').forEach(cb => {
        cb.checked = false;
    });

    const typeMovie = document.getElementById('type-movie');
    const typeSeries = document.getElementById('type-series');
    if (typeMovie) typeMovie.checked = true;
    if (typeSeries) typeSeries.checked = true;
    
    const yearFrom = document.getElementById('yearFrom');
    const yearTo = document.getElementById('yearTo');
    if (yearFrom) yearFrom.value = '';
    if (yearTo) yearTo.value = '';
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    selectedGenres = [];
    selectedCountries = [];
    selectedDirectors = [];
    currentFilters = {};
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value;
    if (searchTerm) {
        currentFilters.search = searchTerm;
    } else {
        delete currentFilters.search;
    }

    loadMoviesData(1, currentFilters);
}