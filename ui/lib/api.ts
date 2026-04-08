export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export type Country = {
  id: string;
  country_name: string;
  iso_code: string;
  region: string;
};

export type Language = {
  id: string;
  language_name: string;
  iso_code: string;
  country_id: string | null;
  is_low_resource: boolean;
};

export type ConsentDocument = {
  id: string;
  title: string;
  document_type: string;
  version: string;
  document_url: string;
  is_active: boolean;
};

export type UserResponse = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};
