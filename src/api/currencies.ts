import { apiFetch } from './client';

export interface Currency {
  id: number;
  code: string;
  symbol: string;
  country: string;
  is_main: boolean;
  currency_change: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCurrencyDto {
  code: string;
  symbol: string;
  country: string;
  is_main?: boolean;
  currency_change?: number;
}

export const getCurrencies = () => apiFetch('/currencies');
export const getCommonCurrencies = (): Promise<Currency[]> => apiFetch('/common/currencies');
export const getCurrenciesPaginated = (page = 1, perPage = 15, search = '') =>
  apiFetch(`/currencies?page=${page}&perPage=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
export const getCurrency = (id: number) => apiFetch(`/currencies/${id}`);
export const createCurrency = (data: CreateCurrencyDto) =>
  apiFetch('/currencies', { method: 'POST', body: JSON.stringify(data) });
export const updateCurrency = (id: number, data: Partial<CreateCurrencyDto>) =>
  apiFetch(`/currencies/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCurrency = (id: number) =>
  apiFetch(`/currencies/${id}`, { method: 'DELETE' });
