import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.serverUrl + '/api/Auth';
  
  private currentUser$ = new BehaviorSubject<User | null>(null);
  private isAuthenticated$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  // Load user from localStorage on init
  private loadUserFromStorage() {
    const token = localStorage.getItem('jarvis_token');
    const userStr = localStorage.getItem('jarvis_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser$.next(user);
        this.isAuthenticated$.next(true);
      } catch {
        this.logout();
      }
    }
  }

  // Register
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.saveAuth(response.token, response.user);
        }
      })
    );
  }

  // Login
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.saveAuth(response.token, response.user);
        }
      })
    );
  }

  // Save auth data
  private saveAuth(token: string, user: User) {
    localStorage.setItem('jarvis_token', token);
    localStorage.setItem('jarvis_user', JSON.stringify(user));
    this.currentUser$.next(user);
    this.isAuthenticated$.next(true);
  }

  // Logout
  logout() {
    localStorage.removeItem('jarvis_token');
    localStorage.removeItem('jarvis_user');
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
  }

  // Get current user
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  // Get user value (sync)
  getCurrentUserValue(): User | null {
    return this.currentUser$.value;
  }

  // Check if authenticated
  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticated$.asObservable();
  }

  // Check auth sync
  isAuthenticated(): boolean {
    return this.isAuthenticated$.value;
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem('jarvis_token');
  }

  // Get user ID
  getUserId(): string | null {
    return this.currentUser$.value?.id || null;
  }

  // Validate token with server
  validateToken(): Observable<{ valid: boolean; userId?: string }> {
    const token = this.getToken();
    return this.http.post<{ valid: boolean; userId?: string }>(
      `${this.apiUrl}/validate`,
      { token }
    );
  }

  // Get current user from server
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }
}