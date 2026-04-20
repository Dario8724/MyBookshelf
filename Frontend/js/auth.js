function getToken() {
    return localStorage.getItem('token');
}

function authHeader() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

function isLoggedIn() {
    return getToken();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('lastSearchQuery');
    sessionStorage.removeItem('lastSearchResults');
    window.location.href = 'login.html';
}