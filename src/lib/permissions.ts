import type { AccountType } from './supabaseClient';

/**
 * Centralized permission checks for every module and action.
 * Returns true if the given role is allowed to perform the action on the module.
 */

type Action = 'create' | 'read' | 'update' | 'delete';

const permissions: Record<string, Record<AccountType, Action[]>> = {
  accounts: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update'],          // team_member + manager accounts only
    team_member: [],
    manager: [],
  },
  board: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: [],
    team_member: [],
    manager: [],
  },
  events: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    team_member: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
  },
  gallery: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    team_member: ['create', 'read'],
    manager: ['create', 'read', 'update'],
  },
  news: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    team_member: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
  },
  team: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    team_member: [],
    manager: [],
  },
  volunteers: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    team_member: ['create', 'read', 'update', 'delete'],
    manager: [],
  },
  podcasts: {
    super_admin: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete'],
    team_member: ['create', 'read', 'update', 'delete'],
    manager: ['create', 'read', 'update'],
  },
  donations: {
    super_admin: ['read'],
    admin: ['read'],
    team_member: ['read'],
    manager: [],
  },
  partnerships: {
    super_admin: ['read'],
    admin: ['read'],
    team_member: ['read'],
    manager: [],
  },
  newsletter: {
    super_admin: ['read'],
    admin: ['read'],
    team_member: [],
    manager: [],
  },
};

export function can(role: AccountType | null, module: string, action: Action): boolean {
  if (!role) return false;
  return permissions[module]?.[role]?.includes(action) ?? false;
}

export function canAccessModule(role: AccountType | null, module: string): boolean {
  if (!role) return false;
  const actions = permissions[module]?.[role];
  return !!actions && actions.length > 0;
}
