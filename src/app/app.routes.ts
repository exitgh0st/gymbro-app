import { Routes } from '@angular/router';
import { authGuard, guestGuard, profileGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard],
    title: 'Sign In — GymBro',
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [profileGuard],
    title: 'Set Up Your Profile — GymBro',
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Dashboard — GymBro',
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard],
    title: 'AI Trainer — GymBro',
  },
  {
    path: 'workout-plans',
    loadComponent: () => import('./features/workout-plans/workout-plans.component').then(m => m.WorkoutPlansComponent),
    canActivate: [authGuard],
    title: 'Workout Plans — GymBro',
  },
  {
    path: 'workout-log',
    loadComponent: () => import('./features/workout-log/workout-log.component').then(m => m.WorkoutLogComponent),
    canActivate: [authGuard],
    title: 'Log Workout — GymBro',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
