
import { createClient } from '@supabase/supabase-js';

// クライアントを動的に作成するための関数
export const createSupabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  return createClient(supabaseUrl, supabaseKey);
};
