import api from './api';

export const ownerService = {
  /**
   * Fetch Store Owner dashboard overview (store info, avg rating, star distribution)
   */
  async getDashboard() {
    return await api.get('/owner/dashboard');
  },

  /**
   * Fetch paginated list of users who rated the store owner's store
   * @param {Object} params - { search, sortBy, sortOrder, page, limit }
   */
  async getRatings(params = {}) {
    return await api.get('/owner/ratings', { params });
  },

  /**
   * Fetch store profile managed by the current store owner
   */
  async getStore() {
    return await api.get('/owner/store');
  }
};

export default ownerService;
