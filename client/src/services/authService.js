import api from './api';

export const authService = {
  /**
   * Log in user
   * @param {Object} credentials - { email, password }
   */
  async login(credentials) {
    return await api.post('/auth/login', credentials);
  },

  /**
   * Register a new normal user
   * @param {Object} userData - { name, email, password, address }
   */
  async register(userData) {
    return await api.post('/auth/register', userData);
  },

  /**
   * Fetch current session profile
   */
  async getMe() {
    return await api.get('/auth/me');
  },

  /**
   * Update authenticated user's password
   * @param {Object} passwordData - { currentPassword, newPassword }
   */
  async updatePassword(passwordData) {
    return await api.patch('/auth/password', passwordData);
  }
};

export default authService;
