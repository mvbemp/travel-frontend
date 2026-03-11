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

export const getGroups = (page = 1, perPage = 10) =>
  apiFetch(`/groups?page=${page}&perPage=${perPage}`);
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
