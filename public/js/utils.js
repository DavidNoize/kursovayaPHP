function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleImageError(img) {
    img.src = 'https://via.placeholder.com/300x450/666666/FFFFFF?text=No+Image';
    img.onerror = null;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getStatusText(status) {
    const statusMap = {
        'wishlist': 'Хочу посмотреть',
        'watching': 'В процессе',
        'watched': 'Просмотрено'
    };
    return statusMap[status] || status;
}

function getRatingColor(rating) {
    if (rating <= 4) return 'red';
    if (rating <= 6) return 'gray';
    return 'green';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => notification.remove());
    
    setTimeout(() => notification.remove(), 3000);
}