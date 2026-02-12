import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or anon key is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export type AccountType = 'super_admin' | 'admin' | 'team_member' | 'manager';

export const VALID_ACCOUNT_TYPES: AccountType[] = ['super_admin', 'admin', 'team_member', 'manager'];

export function isValidAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && VALID_ACCOUNT_TYPES.includes(value as AccountType);
}

export const ACCOUNT_TYPES_TABLE = 'account-types';
