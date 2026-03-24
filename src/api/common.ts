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

export const getExpenses = () => apiFetch('/common/expenses');