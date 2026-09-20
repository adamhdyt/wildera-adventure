import { UnprocessableEntityException } from '@nestjs/common';

export interface LoginInput {
  email: string;
  password: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseLoginInput(value: unknown): LoginInput {
  const body =
    typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const fields: Record<string, string> = {};
  if (!email || !emailPattern.test(email)) {
    fields.email = 'Masukkan alamat email yang valid.';
  }
  if (!password) fields.password = 'Masukkan password.';
  if (Object.keys(fields).length > 0) {
    throw new UnprocessableEntityException({
      code: 'VALIDATION_ERROR',
      message: 'Beberapa data belum valid.',
      fields,
    });
  }
  return { email: email.toLowerCase(), password };
}
