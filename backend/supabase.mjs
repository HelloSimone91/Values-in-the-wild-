import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const authError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const hasSupabaseAuth = () => Boolean(supabase);

export const requireAuthenticatedUser = async (req) => {
  if (!supabase) {
    throw authError('Authentication is not configured.', 503);
  }

  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw authError('Missing bearer token.', 401);
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw authError('Invalid or expired session.', 401);
  }

  return data.user;
};
