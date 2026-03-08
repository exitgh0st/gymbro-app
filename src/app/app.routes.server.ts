import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'auth', renderMode: RenderMode.Client },
  { path: 'onboarding', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'chat', renderMode: RenderMode.Client },
  { path: 'workout-plans', renderMode: RenderMode.Client },
  { path: 'workout-log', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
