import api from './api';

export const storeService = {
  /**
   * Fetch stores catalog with search, sorting, and pagination
   * Automatically includes user_submitted_rating when authenticated
   * @param {Object} params - { search, sortBy, sortOrder, page, limit }
   */
  async getStores(params = {}) {
    return await api.get('/stores', { params });
  },

  /**
   * Get single store details by ID
   * @param {number|string} id - Store ID
   */
  async getStoreById(id) {
    return await api.get(`/stores/${id}`);
  },

  /**
   * Get current user's submitted rating for specified store
   * @param {number|string} storeId - Store ID
   */
  async getMyRating(storeId) {
    return await api.get(`/stores/${storeId}/my-rating`);
  },

  /**
   * Submit a new rating for a store (1-5)
   * @param {number|string} storeId - Store ID
   * @param {number} rating - Integer between 1 and 5
   */
  async submitRating(storeId, rating) {
    return await api.post(`/stores/${storeId}/rating`, { rating });
  },

  /**
   * Modify an existing rating for a store (1-5)
   * @param {number|string} storeId - Store ID
   * @param {number} rating - Integer between 1 and 5
   */
  async modifyRating(storeId, rating) {
    return await api.put(`/stores/${storeId}/rating`, { rating });
  }
};

export default storeService;
