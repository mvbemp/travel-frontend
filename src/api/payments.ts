import { apiFetch } from './client';

export interface CreatePaymentDto {
  payment: number;
  currency_id?: number;
}

export type UpdatePaymentDto = Partial<CreatePaymentDto>;

export const listMemberPayments = (groupId: string | number, memberId: string | number) =>
  apiFetch(`/groups/${groupId}/members/${memberId}/payments`);

export const createMemberPayment = (
  groupId: string | number,
  memberId: string | number,
  data: CreatePaymentDto,
) =>
  apiFetch(`/groups/${groupId}/members/${memberId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updatePayment = (paymentId: string | number, data: UpdatePaymentDto) =>
  apiFetch(`/payments/${paymentId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deletePayment = (paymentId: string | number) =>
  apiFetch(`/payments/${paymentId}`, { method: 'DELETE' });
