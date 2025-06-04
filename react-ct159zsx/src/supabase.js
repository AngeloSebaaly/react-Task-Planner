import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fsjnjwbovnjzcmvzblmq.supabase.co";      // <- paste your URL here
const supabaseAnonKey = "process.env.SUPABASE_KEY"; // <- paste your anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
