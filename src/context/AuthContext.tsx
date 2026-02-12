import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, AccountType, ACCOUNT_TYPES_TABLE, isValidAccountType } from '../lib/supabaseClient';

interface AuthState {
  session: Session | null;
  accountType: AccountType | null;
  loading: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Fetches account_type from the account-types table by user_email.
 * There is NO relationship between the Supabase auth users table and account-types.
 * We simply look up the email in account-types and return the role.
 *
 * Uses case-insensitive matching (lowercased) to avoid mismatches.
 * Validates the role is one of: "super_admin", "admin", "team_member", "manager".
 * Returns null if no row found, email missing, or role invalid.
 */
async function fetchAccountType(email: string | null | undefined): Promise<AccountType | null> {
  if (!email) return null;

  // Lowercase the email to handle case differences between auth and table
  const normalised = email.trim().toLowerCase();

  const { data, error, status } = await supabase
    .from(ACCOUNT_TYPES_TABLE)
    .select('account_type')
    .eq('user_email', normalised)
    .maybeSingle();

  console.log('account-type lookup:', { email: normalised, data, error, status });

  if (error) {
    console.error('Failed to fetch account type for', normalised, error);
    throw error;
  }

  if (!data || !data.account_type) {
    console.warn(`No account-types row found for email: ${normalised}. Check RLS policies on the account-types table.`);
    return null;
  }

  // Strictly validate the account_type value
  if (!isValidAccountType(data.account_type)) {
    console.warn(`Invalid account type "${data.account_type}" for ${normalised}`);
    return null;
  }

  return data.account_type;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  /* Guard: when login() is actively handling auth, the listener must not interfere */
  const loginInProgress = { current: false };

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) { setError(error.message); setLoading(false); return; }

      if (data.session?.user?.email) {
        try {
          const account = await fetchAccountType(data.session.user.email);
          if (!active) return;

          if (!account) {
            await supabase.auth.signOut();
            setSession(null);
            setAccountType(null);
            setError('Access denied. Your account does not have an authorized role.');
          } else {
            setSession(data.session);
            setAccountType(account);
          }
        } catch (err) {
          if (active) {
            await supabase.auth.signOut();
            setSession(null);
            setError('Unable to verify account type.');
          }
        }
      }
      if (active) setLoading(false);
    };

    init();

    /**
     * The onAuthStateChange listener only handles sign-out events
     * (e.g. token expiry, manual sign-out from another tab).
     * Sign-in validation is handled entirely by login() to avoid
     * race conditions and infinite signOut loops.
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      /* Skip if login() is currently handling the flow */
      if (loginInProgress.current) return;

      if (_event === 'SIGNED_OUT') {
        setSession(null);
        setAccountType(null);
      }
      /* For TOKEN_REFRESHED, update the session object (role stays the same) */
      if (_event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(undefined);
    loginInProgress.current = true;

    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setError(error.message || 'Unable to sign in');
        return;
      }

      // Step 2: Check the authenticated user's email in the account-types table.
      //         Use the email from the session (canonical) not from user input.
      const userEmail = data.session?.user?.email ?? email;
      const account = await fetchAccountType(userEmail);

      if (!account) {
        // Email not found in account-types or has invalid role — deny access
        await supabase.auth.signOut();
        setSession(null);
        setAccountType(null);
        setLoading(false);
        setError(
          'Access denied. Your email is not registered with an authorized role ' +
          '(super_admin, admin, team_member, or manager). Contact the CEO or admin.'
        );
        return;
      }

      // Step 3: Valid role confirmed — grant access
      setSession(data.session);
      setAccountType(account);
    } catch (err) {
      await supabase.auth.signOut();
      setSession(null);
      setAccountType(null);
      setError('Unable to verify account type. Please try again or contact admin.');
    } finally {
      loginInProgress.current = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAccountType(null);
  };

  const value = useMemo(
    () => ({ session, accountType, loading, error, login, logout }),
    [session, accountType, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
