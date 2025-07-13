// Session management utility for enhanced security
export class SessionManager {
  private static instance: SessionManager;
  private sessionKey = 'app_session_active';
  private tabId: string;

  constructor() {
    this.tabId = this.generateTabId();
    this.initializeSession();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    // Set session flag in sessionStorage (cleared when browser/tab closes)
    sessionStorage.setItem(this.sessionKey, this.tabId);
    
    // Add event listeners for various close scenarios
    this.addEventListeners();
  }

  private addEventListeners(): void {
    // Browser/tab close
    window.addEventListener('beforeunload', this.handleBrowserClose.bind(this));
    window.addEventListener('unload', this.handleBrowserClose.bind(this));
    
    // Page hide (mobile browsers, tab switching)
    window.addEventListener('pagehide', this.handleBrowserClose.bind(this));
    
    // Visibility change (tab becomes hidden)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Focus events (when user comes back to the tab)
    window.addEventListener('focus', this.checkSessionValidity.bind(this));
    window.addEventListener('pageshow', this.checkSessionValidity.bind(this));
  }

  private handleBrowserClose(): void {
    this.clearAllStorage();
  }

  private handleVisibilityChange(): void {
    // Only handle visibility for session tracking, not storage clearing
    if (document.visibilityState === 'visible') {
      // User returned to tab, refresh session
      this.refreshSession();
    }
  }

  private checkSessionValidity(): void {
    const storedTabId = sessionStorage.getItem(this.sessionKey);
    
    // Only force logout if session is completely invalid
    // Be more lenient to avoid annoying the user
    if (!storedTabId) {
      // Session was cleared, but don't force logout immediately
      // Just refresh the session
      this.refreshSession();
    }
  }

  public clearAllStorage(): void {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any cookies related to authentication
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      });
      
      console.log('🧹 All storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  public forceLogout(): void {
    this.clearAllStorage();
    
    // Redirect to login page or home page
    window.location.href = '/login';
  }

  public isSessionValid(): boolean {
    const storedTabId = sessionStorage.getItem(this.sessionKey);
    return storedTabId === this.tabId;
  }

  public refreshSession(): void {
    sessionStorage.setItem(this.sessionKey, this.tabId);
  }

  // Call this when user explicitly logs out
  public logout(): void {
    this.clearAllStorage();
    window.location.href = '/';
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
