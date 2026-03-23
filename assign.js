import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ldiascscimkddligcvmj.supabase.co';
const supabaseKey = 'sb_publishable_fSvaRt2g5AqHfCMuyCp26Q_0TwHbJXl';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: ediciones } = await supabase.from('Ediciones').select('*');
  let edition = ediciones.find(e => e.nombre_grupo.toLowerCase().includes('123') || e.nombre_grupo.toLowerCase().includes('ola'));
  
  const seniors = [
    { email: 'senior1@staff.com', uid: '0aaf28de-972d-41ec-8a7e-caec30356a2d', nombre: 'Senior', apellido: 'Uno' },
    { email: 'senior2@staff.com', uid: '9446ef0a-f709-469b-9537-0cba078636ce', nombre: 'Senior', apellido: 'Dos' },
    { email: 'senior3@staff.com', uid: '04691b10-a1f2-4e3f-8268-23eff1f85352', nombre: 'Senior', apellido: 'Tres' }
  ];

  for (const s of seniors) {
      const { error: profileError } = await supabase.from('Usuarios').insert({
        uid: s.uid, nombre: s.nombre, apellido: s.apellido, email: s.email
      });
      if (profileError) console.log('Profile error (ignorable if duplicate):', profileError.message);

      const { error: inscError } = await supabase.from('Inscripciones').insert({
        id_usuario: s.uid,
        id_edicion: edition.id,
        rol: 'Senior'
      });
      console.log(s.email, inscError ? inscError : "SUCCESS");
  }
}
run();
