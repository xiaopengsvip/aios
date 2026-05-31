const TOKEN_KEY = "aios_token";
const USER_KEY = "aios_user";

export class AuthService {
  static isLoggedIn(): boolean {
    return !!localStorage.getItem(USER_KEY);
  }

  static getUser(): any {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static saveUser(user: any) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}
