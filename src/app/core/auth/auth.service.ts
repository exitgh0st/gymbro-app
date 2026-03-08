import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _user = signal<AuthUser | null>(this.loadStoredUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<{ access_token: string; refresh_token: string; user: { id: string; email: string } }>(
      `${environment.supabaseUrl}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: { apikey: environment.supabaseAnonKey } }
    ).pipe(
      tap(res => {
        this.storeTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
        const user = { id: res.user.id, email: res.user.email };
        this._user.set(user);
        this.storeUser(user);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  signup(email: string, password: string): Observable<boolean> {
    return this.http.post<{ access_token: string; refresh_token: string; user: { id: string; email: string } }>(
      `${environment.supabaseUrl}/auth/v1/signup`,
      { email, password },
      { headers: { apikey: environment.supabaseAnonKey } }
    ).pipe(
      tap(res => {
        if (res.access_token) {
          this.storeTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
          const user = { id: res.user.id, email: res.user.email };
          this._user.set(user);
          this.storeUser(user);
        }
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('gymbro_access_token');
      localStorage.removeItem('gymbro_refresh_token');
      localStorage.removeItem('gymbro_user');
    }
    this._user.set(null);
    this.router.navigate(['/auth']);
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('gymbro_access_token');
  }

  refreshToken(): Observable<boolean> {
    if (!this.isBrowser) return of(false);
    const token = localStorage.getItem('gymbro_refresh_token');
    if (!token) return of(false);

    return this.http.post<{ access_token: string; refresh_token: string }>(
      `${environment.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      { refresh_token: token },
      { headers: { apikey: environment.supabaseAnonKey } }
    ).pipe(
      tap(res => this.storeTokens(res)),
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  hasProfile(): boolean {
    if (!this.isBrowser) return false;
    const user = this._user();
    if (!user) return false;
    return localStorage.getItem(`gymbro_profile_complete_${user.id}`) === 'true';
  }

  markProfileComplete(): void {
    if (!this.isBrowser) return;
    const user = this._user();
    if (user) {
      localStorage.setItem(`gymbro_profile_complete_${user.id}`, 'true');
    }
  }

  private storeTokens(tokens: AuthTokens): void {
    if (!this.isBrowser) return;
    localStorage.setItem('gymbro_access_token', tokens.access_token);
    localStorage.setItem('gymbro_refresh_token', tokens.refresh_token);
  }

  private loadStoredUser(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const stored = localStorage.getItem('gymbro_user');
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  }

  private storeUser(user: AuthUser): void {
    if (!this.isBrowser) return;
    localStorage.setItem('gymbro_user', JSON.stringify(user));
  }
}
