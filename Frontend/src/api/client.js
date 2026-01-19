const getAuthToken = () => localStorage.getItem('authToken');

const handleUnauthorized = (message) => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    if (message) {
        sessionStorage.setItem('authError', message);
    }
    if (window.location.pathname !== '/login') {
        window.location.replace('/login');
    }
};

export const apiRequest = async (endpoint, options = {}) => {
    const {
        method = 'GET',
        data = null,
        handleUnauthorized: shouldHandleUnauthorized = true,
    } = options;

    const isFormData = data instanceof FormData;
    const headers = {};
    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (data !== null && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(endpoint, {
        method,
        headers,
        body: data === null ? undefined : (isFormData ? data : JSON.stringify(data)),
    });

    if (response.status === 401 && shouldHandleUnauthorized) {
        handleUnauthorized('登录已过期，请重新登录。');
        throw new Error('登录已过期，请重新登录。');
    }

    let result = null;
    try {
        result = await response.json();
    } catch {
        result = null;
    }

    if (!response.ok) {
        const errorMessage = (result && (result.error || result.message))
            ? (result.error || result.message)
            : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
    }

    return result;
};
