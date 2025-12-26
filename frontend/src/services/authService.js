import api from './api';

/**
 * Auth service layer: wraps api.auth and normalizes returned data.
 */
const authService = {
  /**
   * Login with email or username.
   * @param {string} identifier
   * @param {string} password
   * @returns {Promise<{ token: string, tokenType: string, user: object }>}
   */
  async login(identifier, password) {
    const data = await api.auth.login(identifier, password);
    return {
      token: data.access_token,
      tokenType: data.token_type,
      user: data.user || {},
    };
  },

  /**
   * Register a new account.
   * @param {object} payload - includes email, username, password, profile...
   * @returns {Promise<object>}
   */
  async register(payload) {
    const data = await api.auth.register(
      payload.email,
      payload.username,
      payload.password,
      payload.profile || {},
    );
    return data;
  },
};

export default authService;

