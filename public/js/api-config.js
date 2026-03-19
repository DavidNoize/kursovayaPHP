const API_URL = 'http://127.0.0.1:8000/api';

async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        credentials: 'include'
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Ошибка запроса');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function setAuthToken(token) {
    localStorage.setItem('api_token', token);
}

function getAuthToken() {
    return localStorage.getItem('api_token');
}

function removeAuthToken() {
    localStorage.removeItem('api_token');
}

async function getCurrentUser() {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const response = await apiRequest('/user', 'GET', null, token);
        return response;
    } catch (error) {
        removeAuthToken();
        return null;
    }
}

function showNotification(message, type = 'success') {
    alert(message);
}