import { apiFetch } from './client';

export interface CreateUserDto {
  email: string;
  full_name: string;
  password: string;
  type: 'admin' | 'user';
  phone_number: string;
}

export const getUsers = (page = 1, perPage = 15, search = '') =>
  apiFetch(`/users?page=${page}&perPage=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
export const getUser = (id: string) => apiFetch(`/users/${id}`);
export const createUser = (data: CreateUserDto) =>
  apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<CreateUserDto>) =>
  apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string) =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });
