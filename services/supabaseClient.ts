import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let client: SupabaseClient | null = null;

export type SignOutScope = 'global' | 'local' | 'others';

export const isSupabaseConfigured = (): boolean => {
  const isConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
  const isPlaceholder = SUPABASE_URL.includes('your-project.supabase.co');
  return isConfigured && !isPlaceholder;
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    });
  }

  return client;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
};

export const sendMagicLink = async (email: string, redirectTo: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Authentication is not configured.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw error;
  }
};

export const startGoogleSignIn = async (redirectTo: string): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Authentication is not configured.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
};

export const signOutUser = async (scope: SignOutScope = 'local'): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut({ scope });
  if (error) {
    throw error;
  }
};
