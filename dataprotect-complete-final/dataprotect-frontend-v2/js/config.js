// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://5000-iedpxs544l4w9xdggf06w-f7f9d60d.manusvm.computer/api',
    AUTH_TOKEN_KEY: 'dataprotect_token',
    USER_KEY: 'dataprotect_user'
};

// API Client
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    getAuthHeaders() {
        const token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Request failed' }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        if (data.token) {
            localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, data.token);
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(data.user));
        }
        return data;
    }

    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        if (data.token) {
            localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, data.token);
            localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(data.user));
        }
        return data;
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    logout() {
        localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
        localStorage.removeItem(API_CONFIG.USER_KEY);
    }

    isAuthenticated() {
        return !!localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
    }

    getCurrentUser() {
        const userStr = localStorage.getItem(API_CONFIG.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    // Categories
    async getCategories() {
        return await this.request('/categories');
    }

    async getCategoryBySlug(slug) {
        return await this.request(`/categories/slug/${slug}`);
    }

    async getChallengesByCategory(slug) {
        const data = await this.request(`/categories/slug/${slug}`);
        return { challenges: data.challenges || [] };
    }

    // Challenges
    async getChallenges() {
        return await this.request('/challenges');
    }

    async getChallengeById(id) {
        return await this.request(`/challenges/${id}`);
    }

    // Alias for compatibility
    async getChallenge(id) {
        return await this.getChallengeById(id);
    }

    async getChallengesByCategory(category) {
        return await this.request(`/challenges/category/${category}`);
    }

    // Machines
    async startMachine(challengeId) {
        return await this.request(`/machines/start/${challengeId}`, {
            method: 'POST'
        });
    }

    async stopMachine(machineId) {
        return await this.request(`/machines/stop/${machineId}`, {
            method: 'POST'
        });
    }

    async getUserMachines() {
        return await this.request('/docker/user/machines');
    }

    async getMachineStatus(challengeId) {
        try {
            const data = await this.request(`/docker/status/${challengeId}`);
            return data;
        } catch (error) {
            return { machine: null };
        }
    }

    // Submissions
    async submitFlag(challengeId, flag) {
        return await this.request('/submissions/submit', {
            method: 'POST',
            body: JSON.stringify({ challenge_id: challengeId, flag })
        });
    }

    // Leaderboard
    async getLeaderboard(limit = 10) {
        return await this.request(`/leaderboard/top/${limit}`);
    }
}

// Global API instance
const api = new APIClient();
