/**
 * Navigation and role redirection utilities
 */

/**
 * Returns the default dashboard/home route for a given user role.
 * @param {string} role - 'ADMIN' | 'STORE_OWNER' | 'USER'
 * @returns {string} - The destination URL
 */
export const getRoleRedirectPath = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'STORE_OWNER':
      return '/owner/dashboard';
    case 'USER':
    default:
      return '/user/stores';
  }
};
