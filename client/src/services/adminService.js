import api from './api';

export const adminService = {
  /**
   * Fetch admin summary dashboard statistics
   */
  async getDashboard() {
    return await api.get('/admin/dashboard');
  },

  /**
   * Get paginated users with search, role filter, and sorting
   * @param {Object} params - { search, role, sortBy, sortOrder, page, limit }
   */
  async getUsers(params = {}) {
    return await api.get('/admin/users', { params });
  },

  /**
   * Get single user details by ID
   * @param {number|string} id - User ID
   */
  async getUserById(id) {
    return await api.get(`/admin/users/${id}`);
  },

  /**
   * Create a new user (ADMIN, STORE_OWNER, or USER)
   * @param {Object} userData - { name, email, password, address, role }
   */
  async createUser(userData) {
    return await api.post('/admin/users', userData);
  },

  /**
   * Get paginated stores with search and sorting
   * @param {Object} params - { search, sortBy, sortOrder, page, limit }
   */
  async getStores(params = {}) {
    return await api.get('/admin/stores', { params });
  },

  /**
   * Create a new store
   * @param {Object} storeData - { name, email, address, ownerId }
   */
  async createStore(storeData) {
    return await api.post('/admin/stores', storeData);
  },

  /**
   * Get all rating logs
   * @param {Object} params - { search, sortBy, sortOrder, page, limit }
   */
  async getRatings(params = {}) {
    return await api.get('/admin/ratings', { params });
  }
};

export default adminService;
