import { apiFetch } from './client';

export interface CreateGroupDto {
  name: string;
  description?: string;
  date: string;
}

export interface AddMemberDto {
  first_name: string;
  last_name: string;
  pax_type?: 'A' | 'C' | 'I';
  nationality?: string;
  passport?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  date_of_expiry?: string;
  comment?: string;
  currency_id?: number;
  payment?: number;
}

export const getGroupDashboard = () => apiFetch('/groups/dashboard');

export const getGroups = (page = 1, perPage = 10, search = '') =>
  apiFetch(`/groups?page=${page}&perPage=${perPage}${search ? `&search=${encodeURIComponent(search)}` : ''}`);
export const getGroup = (id: string) => apiFetch(`/groups/${id}`);
export const createGroup = (data: CreateGroupDto) =>
  apiFetch('/groups', { method: 'POST', body: JSON.stringify(data) });
export const updateGroup = (id: string, data: Partial<CreateGroupDto>) =>
  apiFetch(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteGroup = (id: string) =>
  apiFetch(`/groups/${id}`, { method: 'DELETE' });
export const finishGroup = (id: string) =>
  apiFetch(`/groups/${id}/finish`, { method: 'PATCH' });
export type UpdateMemberDto = Partial<AddMemberDto>;

export const addMember = (groupId: string | number, data: AddMemberDto) =>
  apiFetch(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(data) });
export const updateMember = (groupId: string | number, memberId: string | number, data: UpdateMemberDto) =>
  apiFetch(`/groups/${groupId}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteMember = (groupId: string | number, memberId: string | number) =>
  apiFetch(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });

export const getDeletedMembers = (groupId: string | number) =>
  apiFetch(`/groups/${groupId}/members/deleted`);

export const downloadGroupReport = async (groupId: string | number, filename: string) => {
  const token = localStorage.getItem('token');
  const lang = localStorage.getItem('lang') ?? 'uz';
  const BASE_URL = import.meta.env.VITE_API_URL ?? '';
  const res = await fetch(`${BASE_URL}/groups/${groupId}/report`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Accept-Language': lang,
    },
  });
  if (!res.ok) throw new Error(`Failed to download report: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const addGroupExpense = (groupId: string | number, data: { expense_id: number; value: number }) =>
  apiFetch(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) });
export const deleteGroupExpense = (groupId: string | number, groupExpenseId: number) =>
  apiFetch(`/groups/${groupId}/expenses/${groupExpenseId}`, { method: 'DELETE' });
