export interface SupportRequest {
  firstName: string;
  lastName: string;
  companyId: string;
  subject: string;
  message: string;
}

export interface SupportResponse {
  success: boolean;
  message: string;
}
