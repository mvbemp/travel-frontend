import { apiFetch } from './client';

export function login(email: string, password: string) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return apiFetch('/auth/me');
}

export function updateProfile(data: { email?: string; password?: string }) {
  return apiFetch('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
