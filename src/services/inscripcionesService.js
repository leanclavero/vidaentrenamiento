import { supabase } from '../lib/supabase';

// Obtener ediciones donde estoy enrolado
export const getMisInscripciones = async (idUsuario) => {
  const { data, error } = await supabase
    .from('Inscripciones')
    .select('*, edicion:Ediciones(*)')
    .eq('id_usuario', idUsuario);
  if (error) throw error;
  return data;
};

// Obtener los participantes de una edición para mostrarlos (Admin/Coordinador)
export const getInscripciones = async (idEdicion) => {
  const { data, error } = await supabase
    .from('Inscripciones')
    .select(`
      *,
      usuario:Usuarios!id_usuario(uid, nombre, apellido, email),
      superior:Usuarios!id_superior(uid, nombre, apellido)
    `)
    .eq('id_edicion', idEdicion);
  if (error) throw error;
  return data;
};

// Insertar/Unir un usuario a una edición
export const joinEdicionAsRole = async (idUsuario, idEdicion, rol) => {
  try {
    const { data, error } = await supabase
      .from('Inscripciones')
      .upsert({
        id_usuario: idUsuario,
        id_edicion: idEdicion,
        rol: rol
      }, { onConflict: 'id_usuario, id_edicion' })
      .select()
      .single();
    
    // Si da error por llave duplicada, lo omitimos porque ya está inscripto
    if (error && error.code !== '23505') throw error;
    return data;
  } catch (err) {
    if (err.code !== '23505') throw err; // 23505 is unique violation
  }
};

// Actualizar un rol o re-asignar superior
export const updateInscripcion = async (id, updates) => {
  const { data, error } = await supabase
    .from('Inscripciones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Obtener mis participantes (para Senior/Papisado)
export const getMisParticipantes = async (idSuperior) => {
  const { data, error } = await supabase
    .from('Inscripciones')
    .select('*, usuario:Usuarios!id_usuario(uid, nombre, apellido, email)')
    .eq('id_superior', idSuperior);
  if (error) throw error;
  return data;
};
