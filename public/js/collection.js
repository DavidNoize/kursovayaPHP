let currentUser = null;
let collectionItems = [];
let filteredItems = [];
let currentStatus = 'all';
let currentSort = 'addedDate';

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Collection.js загружен');
    currentUser = await getCurrentUser();
    updateAuthUI();
    
    if (!currentUser) {
        showUnauthorizedMessage();
        return;
    }
    
    await loadCollection();
    setupCollectionFilters();
    setupAuthSystem();
});

async function loadCollection() {
    try {
        console.log('Загрузка коллекции...');
        const token = getAuthToken();
        const data = await apiRequest('/collection', 'GET', null, token);
        console.log('Коллекция загружена:', data);
        collectionItems = data;
        filteredItems = [...collectionItems];
        
        renderCollection();
        updateStats();
    } catch (error) {
        console.error('Ошибка загрузки коллекции:', error);
        showNotification('Ошибка загрузки коллекции', 'error');
    }
}

function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    const noCollection = document.getElementById('noCollection');
    
    if (!grid) return;
    
    if (filteredItems.length === 0) {
        grid.innerHTML = '';
        if (noCollection) noCollection.style.display = 'block';
        return;
    }
    
    if (noCollection) noCollection.style.display = 'none';
    
    grid.innerHTML = '';
    filteredItems.forEach(item => {
        const card = createCollectionCard(item);
        grid.appendChild(card);
    });
}

function createCollectionCard(item) {
    const movie = item.movie;
    const card = document.createElement('div');
    card.className = 'collection-item';
    
    const statusClass = `badge-${item.status}`;
    const statusText = getStatusText(item.status);
    const rating = item.user_rating || 0;
    
    card.innerHTML = `
        <div class="collection-item-header">
            <img src="${movie.poster || 'https://via.placeholder.com/300x450'}" 
                 alt="${movie.title}" 
                 class="collection-item-poster"
                 onerror="handleImageError(this)">
            <div class="collection-item-badge ${statusClass}">${statusText}</div>
        </div>
        <div class="collection-item-content">
            <div class="collection-item-title">${movie.title}</div>
            <div class="collection-item-meta">
                <span>${movie.release_year} • ${movie.type === 'movie' ? 'Фильм' : 'Сериал'}</span>
                ${rating > 0 ? `
                    <div class="rating-badge rating-color-${getRatingColor(rating)}">
                        <span class="rating-star-white">★</span> ${rating}
                    </div>
                ` : '<span class="no-rating-text">Нет оценки</span>'}
            </div>
            ${item.comment ? `
                <div class="collection-item-comment">
                    <p>${item.comment}</p>
                </div>
            ` : ''}
            <div class="collection-item-actions">
                <button class="btn-small btn-edit" data-id="${movie.id}">Изменить</button>
                <button class="btn-small btn-remove" data-id="${movie.id}">Удалить</button>
            </div>
        </div>
    `;
    
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(movie.id, item);
    });
    
    card.querySelector('.btn-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmRemove(movie.id, movie.title);
    });
    
    card.addEventListener('click', () => {
        openMovieModal(movie.id);
    });
    
    return card;
}

async function updateStats() {
    try {
        const token = getAuthToken();
        const stats = await apiRequest('/collection/stats', 'GET', null, token);
        
        const statsElement = document.getElementById('collectionStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stat-item">
                    <span class="stat-number">${stats.total}</span>
                    <span class="stat-label">Всего</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${stats.wishlist}</span>
                    <span class="stat-label">Хочу</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${stats.watching}</span>
                    <span class="stat-label">Смотрю</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${stats.watched}</span>
                    <span class="stat-label">Просмотрено</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${stats.average_rating}</span>
                    <span class="stat-label">Ср. оценка</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function openEditModal(movieId, item) {
    const modal = document.getElementById('collectionItemModal');
    const modalBody = document.getElementById('collectionItemModalBody');
    
    modalBody.innerHTML = `
        <div class="management-modal">
            <h2>Редактирование</h2>
            
            <div class="modal-section">
                <h3>Статус</h3>
                <select id="editStatus" class="status-dropdown">
                    <option value="wishlist" ${item.status === 'wishlist' ? 'selected' : ''}>Хочу посмотреть</option>
                    <option value="watching" ${item.status === 'watching' ? 'selected' : ''}>В процессе</option>
                    <option value="watched" ${item.status === 'watched' ? 'selected' : ''}>Просмотрено</option>
                </select>
            </div>
            
            <div class="modal-section">
                <h3>Оценка</h3>
                <div class="rating-oval-container">
                    <div class="rating-star-grey">★</div>
                    ${Array.from({length: 10}, (_, i) => {
                        const num = i + 1;
                        const isSelected = item.user_rating === num;
                        return `<div class="rating-oval-number ${isSelected ? 'selected' : ''}" 
                                     data-rating="${num}"
                                     onclick="selectRating(this)">${num}</div>`;
                    }).join('')}
                </div>
            </div>
            
            <div class="modal-section">
                <h3>Комментарий</h3>
                <textarea id="editComment" placeholder="Ваши впечатления..." rows="4">${item.comment || ''}</textarea>
            </div>
            
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeCollectionModal()">Отмена</button>
                <button class="btn-save" onclick="saveCollectionItem(${movieId})">Сохранить</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

async function saveCollectionItem(movieId) {
    const status = document.getElementById('editStatus').value;
    const selectedRating = document.querySelector('.rating-oval-number.selected');
    const rating = selectedRating ? parseInt(selectedRating.dataset.rating) : null;
    const comment = document.getElementById('editComment').value;
    
    try {
        const token = getAuthToken();
        await apiRequest(`/collection/${movieId}`, 'POST', {
            status,
            user_rating: rating,
            comment
        }, token);
        
        showNotification('Сохранено!', 'success');
        closeCollectionModal();
        await loadCollection();
    } catch (error) {
        showNotification('Ошибка сохранения', 'error');
    }
}

function confirmRemove(movieId, title) {
    if (confirm(`Удалить "${title}" из коллекции?`)) {
        removeFromCollection(movieId);
    }
}

async function removeFromCollection(movieId) {
    try {
        const token = getAuthToken();
        await apiRequest(`/collection/${movieId}`, 'DELETE', null, token);
        
        showNotification('Удалено из коллекции', 'success');
        await loadCollection();
    } catch (error) {
        showNotification('Ошибка удаления', 'error');
    }
}

function setupCollectionFilters() {
    const statusFilter = document.querySelectorAll('.status-filter-btn');
    const sortSelect = document.getElementById('collectionSort');
    const searchInput = document.getElementById('collectionSearch');
    const searchBtn = document.getElementById('collectionSearchBtn');
    
    statusFilter.forEach(btn => {
        btn.addEventListener('click', function() {
            statusFilter.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentStatus = this.dataset.status;
            applyFilters();
        });
    });
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            applyFilters();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('collectionSearch')?.value.toLowerCase() || '';
    
    filteredItems = collectionItems.filter(item => {
        const statusMatch = currentStatus === 'all' || item.status === currentStatus;
        const searchMatch = searchTerm === '' || 
            item.movie.title.toLowerCase().includes(searchTerm);
        return statusMatch && searchMatch;
    });
    
    filteredItems.sort((a, b) => {
        switch(currentSort) {
            case 'title':
                return a.movie.title.localeCompare(b.movie.title);
            case 'rating':
                return (b.user_rating || 0) - (a.user_rating || 0);
            case 'year':
                return b.movie.release_year - a.movie.release_year;
            default:
                return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    renderCollection();
    
    const resultsElement = document.getElementById('collectionResults');
    if (resultsElement) {
        resultsElement.textContent = `Найдено: ${filteredItems.length}`;
    }
}

function selectRating(element) {
    document.querySelectorAll('.rating-oval-number').forEach(el => {
        el.classList.remove('selected');
    });
    element.classList.add('selected');
}

function closeCollectionModal() {
    document.getElementById('collectionItemModal').style.display = 'none';
}

function showUnauthorizedMessage() {
    const grid = document.getElementById('collectionGrid');
    const noCollection = document.getElementById('noCollection');
    
    if (grid) grid.innerHTML = '';
    if (noCollection) {
        noCollection.style.display = 'block';
        noCollection.innerHTML = `
            <div class="empty-state">
                <h2>Требуется авторизация</h2>
                <p>Для просмотра коллекции необходимо войти</p>
                <button class="btn-primary" onclick="window.location.href='index.html'">На главную</button>
            </div>
        `;
    }
}

async function openMovieModal(movieId) {
    try {
        const movie = await apiRequest(`/movies/${movieId}`);
        
        const modal = document.getElementById('collectionItemModal');
        const modalBody = document.getElementById('collectionItemModalBody');
        
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
            
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeCollectionModal()">Закрыть</button>
            </div>
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        showNotification('Ошибка загрузки фильма', 'error');
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const profileAvatar = document.getElementById('profileAvatar');
    const userName = document.getElementById('userName');

    if (currentUser) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'block';
        userName.textContent = currentUser.name;
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}

function setupAuthSystem() {
    const loginBtn = document.querySelector('.btn-login');
    const registerBtn = document.querySelector('.btn-register');
    const logoutBtn = document.getElementById('logoutBtn');
    const myCollectionBtn = document.getElementById('myCollectionBtn');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const closeButtons = document.querySelectorAll('.auth-close');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('loginModal').style.display = 'block';
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            document.getElementById('registerModal').style.display = 'block';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            removeAuthToken();
            currentUser = null;
            updateAuthUI();
            showNotification('Вы вышли из системы');
            window.location.href = 'index.html';
        });
    }

    if (myCollectionBtn) {
        myCollectionBtn.addEventListener('click', () => {
            window.location.href = 'collection.html';
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

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const data = await apiRequest('/login', 'POST', { email, password });
                setAuthToken(data.token);
                currentUser = data.user;
                updateAuthUI();
                document.getElementById('loginModal').style.display = 'none';
                showNotification('Вход выполнен успешно');
                window.location.reload();
            } catch (error) {
                showNotification('Неверный email или пароль', 'error');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
                window.location.reload();
            } catch (error) {
                showNotification('Ошибка регистрации', 'error');
            }
        });
    }
}