class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    
    // Also store in secure cookies as backup
    this.setSecureCookie('access_token', access, 15); // 15 minutes
    this.setSecureCookie('refresh_token', refresh, 60 * 24 * 7); // 7 days
  }

  getAccessToken(): string | null {
    // Try memory first, fallback to cookie
    return this.accessToken || this.getCookie('access_token');
  }

  getRefreshToken(): string | null {
    // Try memory first, fallback to cookie  
    return this.refreshToken || this.getCookie('refresh_token');
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.deleteCookie('access_token');
    this.deleteCookie('refresh_token');
  }

  private setSecureCookie(name: string, value: string, minutes: number) {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + minutes);
    
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  }

  private deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
  }
}

export const tokenManager = new TokenManager();