const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${path}`, {   // ← use env variable
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': localStorage.getItem('lang') ?? 'uz',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/auth/login') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
}
