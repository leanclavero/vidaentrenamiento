import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('c:/Users/plcla/.gemini/antigravity/scratch/coaching-app/.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  const { data: users, error: usersErr } = await supabase.from('Usuarios').select('*');
  console.log("Users in Usuarios:", users?.length, usersErr);
  if (users) {
      console.log(users.filter(u => u.email && u.email.includes('participante')));
  }

  const { data: insc, error: inscErr } = await supabase.from('Inscripciones').select('*');
  console.log("Inscripciones:", insc?.length, inscErr);
  if (insc) {
      console.log(insc);
  }
}

checkUsers();
