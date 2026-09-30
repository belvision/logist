import { z } from 'zod';
import { CreateCompanySchema, AddUserToCompanySchema, InviteUserToCompanySchema } from './company.schema';

export type CreateCompanyRequest = z.infer<typeof CreateCompanySchema>;
export type AddUserToCompanyRequest = z.infer<typeof AddUserToCompanySchema>;
export type InviteUserToCompanyRequest = z.infer<typeof InviteUserToCompanySchema>;

export interface CompanyResponse {
	ok: boolean;
	company?: unknown;
	error?: string;
}

export interface CompanyUsersResponse {
	ok: boolean;
	users?: unknown[];
	error?: string;
}
