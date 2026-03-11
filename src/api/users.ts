import { apiFetch } from './client';

export interface CreateUserDto {
  email: string;
  full_name: string;
  password: string;
  type: 'admin' | 'user';
  phone_number: string;
}

export const getUsers = () => apiFetch('/users');
export const getUser = (id: string) => apiFetch(`/users/${id}`);
export const createUser = (data: CreateUserDto) =>
  apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<CreateUserDto>) =>
  apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUser = (id: string) =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });
