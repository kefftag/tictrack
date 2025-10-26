import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_OAUTH_CONFIG = {
  androidClientId: '', // User needs to configure this
  iosClientId: '', // User needs to configure this
  webClientId: '', // User needs to configure this
  scopes: [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
};

const GOOGLE_TOKEN_STORAGE_KEY = '@tictrack_google_token';
const GOOGLE_USER_STORAGE_KEY = '@tictrack_google_user';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
  scope?: string;
  idToken?: string;
  issuedAt: number; // Timestamp when token was issued
}

export class GoogleAuthService {
  private static instance: GoogleAuthService;
  private currentToken: GoogleAuthToken | null = null;
  private currentUser: GoogleUser | null = null;

  private constructor() {}

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Initialize the service by loading stored tokens
   */
  async initialize(): Promise<void> {
    try {
      const tokenStr = await AsyncStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
      const userStr = await AsyncStorage.getItem(GOOGLE_USER_STORAGE_KEY);

      if (tokenStr) {
        this.currentToken = JSON.parse(tokenStr);
      }

      if (userStr) {
        this.currentUser = JSON.parse(userStr);
      }

      // Check if token needs refresh
      if (this.currentToken && this.isTokenExpired(this.currentToken)) {
        console.log('Token expired, attempting refresh...');
        await this.refreshAccessToken();
      }
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: GoogleAuthToken): boolean {
    if (!token.expiresIn) return false;

    const now = Date.now();
    const expiresAt = token.issuedAt + token.expiresIn * 1000;

    // Add 5 minute buffer
    return now >= expiresAt - 5 * 60 * 1000;
  }

  /**
   * Get the OAuth configuration
   */
  getOAuthConfig() {
    return GOOGLE_OAUTH_CONFIG;
  }

  /**
   * Create authentication request configuration
   */
  createAuthRequest() {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'tictrack',
      path: 'redirect',
    });

    console.log('Redirect URI:', redirectUri);

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    return {
      redirectUri,
      discovery,
      clientId: GOOGLE_OAUTH_CONFIG.androidClientId,
      scopes: GOOGLE_OAUTH_CONFIG.scopes,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    };
  }

  /**
   * Handle authentication response
   */
  async handleAuthResponse(
    response: AuthSession.AuthSessionResult,
    codeExchanger: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (response.type !== 'success') {
        return {
          success: false,
          error: response.type === 'cancel' ? 'Authentication cancelled' : 'Authentication failed',
        };
      }

      // Exchange code for tokens
      const tokenResponse = await codeExchanger(response.params.code);

      const token: GoogleAuthToken = {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresIn: tokenResponse.expiresIn,
        tokenType: tokenResponse.tokenType || 'Bearer',
        scope: tokenResponse.scope,
        idToken: tokenResponse.idToken,
        issuedAt: Date.now(),
      };

      // Store token
      await this.saveToken(token);

      // Fetch user info
      await this.fetchUserInfo(token.accessToken);

      return { success: true };
    } catch (error: any) {
      console.error('Error handling auth response:', error);
      return {
        success: false,
        error: error.message || 'Failed to complete authentication',
      };
    }
  }

  /**
   * Save token to storage
   */
  private async saveToken(token: GoogleAuthToken): Promise<void> {
    this.currentToken = token;
    await AsyncStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, JSON.stringify(token));
  }

  /**
   * Fetch user information from Google
   */
  private async fetchUserInfo(accessToken: string): Promise<void> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userInfo = await response.json();

      const user: GoogleUser = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };

      this.currentUser = user;
      await AsyncStorage.setItem(GOOGLE_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.currentToken?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_OAUTH_CONFIG.androidClientId,
          refresh_token: this.currentToken.refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      const updatedToken: GoogleAuthToken = {
        ...this.currentToken,
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        issuedAt: Date.now(),
      };

      await this.saveToken(updatedToken);

      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, clear tokens and require re-authentication
      await this.signOut();
      throw error;
    }
  }

  /**
   * Get current access token (refreshes if needed)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.currentToken) {
      return null;
    }

    // Refresh if expired
    if (this.isTokenExpired(this.currentToken)) {
      await this.refreshAccessToken();
    }

    return this.currentToken?.accessToken || null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): GoogleUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentToken !== null && this.currentUser !== null;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      // Revoke token if possible
      if (this.currentToken?.accessToken) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${this.currentToken.accessToken}`,
          {
            method: 'POST',
          }
        ).catch((error) => {
          console.error('Error revoking token:', error);
        });
      }

      // Clear storage
      await AsyncStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
      await AsyncStorage.removeItem(GOOGLE_USER_STORAGE_KEY);

      this.currentToken = null;
      this.currentUser = null;

      console.log('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Update OAuth client IDs (for configuration)
   */
  static updateClientIds(androidId: string, iosId?: string, webId?: string): void {
    GOOGLE_OAUTH_CONFIG.androidClientId = androidId;
    if (iosId) GOOGLE_OAUTH_CONFIG.iosClientId = iosId;
    if (webId) GOOGLE_OAUTH_CONFIG.webClientId = webId;
  }
}
