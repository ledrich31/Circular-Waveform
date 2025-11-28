const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY are required in your .env file.');
  // Exit or throw an error to prevent the app from running without credentials
  process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Connected to Supabase.');

module.exports = supabase;