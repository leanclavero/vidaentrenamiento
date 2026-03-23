import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ldiascscimkddligcvmj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fSvaRt2g5AqHfCMuyCp26Q_0TwHbJXl';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const usersToCreate = [
  { email: 'plclavero@gmail.com', pass: 'Clavero33489772-', rol: 'Owner', nombre: 'Leandro', apellido: 'Propietario' },
  { email: 'admin@vidaentrenamiento.com', pass: 'VicMag2000-', rol: 'Admin', nombre: 'Admin', apellido: 'General' },
  { email: 'coach@vidaentrenamiento.com', pass: 'VicMag2000-', rol: 'Coach', nombre: 'Coach', apellido: 'Entrenamiento' },
  { email: 'coord@vidaentrenamiento.com', pass: 'VicMag2000-', rol: 'Coordinador', nombre: 'Coordinador', apellido: 'General' },
  { email: 'senior1@vidaentrenamiento.com', pass: 'VicMag2000-', rol: 'Senior', nombre: 'Senior', apellido: 'Uno' },
  { email: 'senior2@vidaentrenamiento.com', pass: 'VicMag2000-', rol: 'Senior', nombre: 'Senior', apellido: 'Dos' },
  { email: 'senior3@vidaentrenamiento.com', pass: 'VicMag2000-', rol: 'Senior', nombre: 'Senior', apellido: 'Tres' },
];

for(let i=1; i<=17; i++) {
  usersToCreate.push({
    email: `participante${i}@vidaentrenamiento.com`,
    pass: 'VicMag2000-',
    rol: 'Participante',
    nombre: 'Participante',
    apellido: String(i)
  });
}

async function startSeed() {
  console.log("Iniciando creación de 23 cuentas...");
  for (const u of usersToCreate) {
    console.log(`Procesando: ${u.email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.pass,
      options: { data: { nombre: u.nombre, apellido: u.apellido } }
    });

    if (authError) {
      console.log(`- INFO auth: ${authError.message}`);
    }
    
    let uid = authData?.user?.id;
    if (!uid && authError?.message.includes("already registered")) {
       const { data: loginData } = await supabase.auth.signInWithPassword({ email: u.email, password: u.pass });
       if (loginData?.user) uid = loginData.user.id;
    }

    if (uid) {
      const { error: dbError } = await supabase.from('Usuarios').upsert([{
        uid: uid,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email
      }], { onConflict: 'uid' });

      if (dbError) {
         console.log(`- ERROR insertando perfil: ${dbError.message}`);
      } else {
         console.log(`- OK perfil guardado en DB.`);
         
         // Inscribirlos en la primera edición si existe (para probar roles de inmediato)
         const { data: eds } = await supabase.from('Ediciones').select('id').limit(1);
         if (eds && eds.length > 0) {
           await supabase.from('Inscripciones').upsert({
             id_usuario: uid,
             id_edicion: eds[0].id,
             rol: u.rol
           }, { onConflict: 'id_usuario, id_edicion' });
           console.log(`- OK Inscrito en edición default como ${u.rol}`);
         }
      }
    }
  }
}

startSeed();
