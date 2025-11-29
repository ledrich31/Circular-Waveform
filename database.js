   const { createClient } = require('@supabase/supabase-js');
 console.log('database.js: Starting up...');
 
 const supabaseUrl = process.env.SUPABASE_URL;
 const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
 
 console.log(`database.js: SUPABASE_URL is ${supabaseUrl ? 'set' : 'NOT SET'}`);
 console.log(`database.js: SUPABASE_ANON_KEY is ${supabaseAnonKey ? 'set' : 'NOT SET'}`);
 
 if (!supabaseUrl || !supabaseAnonKey) {
   console.error('database.js: SUPABASE_URL and SUPABASE_ANON_KEY are required.')
   process.exit(1);
 }
 
 let supabase;
 try {
   console.log('database.js: Attempting to create Supabase client...');
   supabase = createClient(supabaseUrl, supabaseAnonKey);
   console.log('database.js: Supabase client created successfully.');
 } catch (error) {
   console.error('database.js: Error creating Supabase client:', error.message);
   process.exit(1); // Still exit, but after logging the error
 }
 
 module.exports = supabase;