import { apiFetch } from './client';

export interface CreateGroupDto {
  name: string;
  description?: string;
  date: string;
}

export interface AddMemberDto {
  name: string;
  passport?: string;
  passport_type?: 'green_passport' | 'red_passport' | 'id_card';
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
export interface UpdateMemberDto {
  name?: string;
  passport?: string;
  passport_type?: 'green_passport' | 'red_passport' | 'id_card';
  payment?: number;
}

export const addMember = (groupId: string | number, data: AddMemberDto) =>
  apiFetch(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(data) });
export const updateMember = (groupId: string | number, memberId: string | number, data: UpdateMemberDto) =>
  apiFetch(`/groups/${groupId}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteMember = (groupId: string | number, memberId: string | number) =>
  apiFetch(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });

export const addGroupExpense = (groupId: string | number, data: { expense_id: number; value: number }) =>
  apiFetch(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) });
export const deleteGroupExpense = (groupId: string | number, groupExpenseId: number) =>
  apiFetch(`/groups/${groupId}/expenses/${groupExpenseId}`, { method: 'DELETE' });
