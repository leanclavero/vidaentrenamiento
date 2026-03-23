import { supabase } from '../lib/supabase';

// Obtener todos los usuarios con sus inscripciones
export const getAllUsersWithEnrollments = async () => {
  const { data, error } = await supabase
    .from('Usuarios')
    .select(`
      *,
      Inscripciones!id_usuario (
        id,
        rol,
        id_edicion,
        Ediciones (
          nombre_grupo
        )
      )
    `);
  if (error) throw error;
  return data;
};

// Asignar un usuario a una edición
export const assignUserToEdition = async (uid, edicionId, rol) => {
  const { data, error } = await supabase
    .from('Inscripciones')
    .upsert({
      id_usuario: uid,
      id_edicion: edicionId,
      rol: rol
    }, { onConflict: 'id_usuario, id_edicion' });
  
  if (error) throw error;
  return data;
};

// Eliminar inscripción de un usuario de una edición
export const removeUserFromEdition = async (inscripcionId) => {
  const { error } = await supabase
    .from('Inscripciones')
    .delete()
    .eq('id', inscripcionId);
  if (error) throw error;
};
