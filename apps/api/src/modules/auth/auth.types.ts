import type { Request } from 'express';

export interface AdminSessionUser {
  email: string;
  id: string;
  name: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  admin: AdminSessionUser;
}

export interface SessionPayload {
  sessionVersion: string;
  sub: string;
}
