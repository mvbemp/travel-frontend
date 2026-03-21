import { apiFetch } from './client';

export interface Expense {
  id: number;
  name: string;
  currency_id: number;
  value: string;
  created_at: string;
  updated_at: string;
  currency: { id: number; code: string; symbol: string; country: string };
}

export interface CreateExpenseDto {
  name: string;
  currency_id: number;
  value: number;
}

export const getExpenses = () => apiFetch('/expenses');
export const getExpensesPaginated = (page = 1, perPage = 15, search = '') =>
  apiFetch(`/expenses?page=${page}&perPage=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
export const getExpense = (id: number) => apiFetch(`/expenses/${id}`);
export const createExpense = (data: CreateExpenseDto) =>
  apiFetch('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: number, data: Partial<CreateExpenseDto>) =>
  apiFetch(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteExpense = (id: number) =>
  apiFetch(`/expenses/${id}`, { method: 'DELETE' });
