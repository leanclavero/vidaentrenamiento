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

// Obtener cantidad de participantes de una edición (Rol 'Participante')
export const getParticipantsCount = async (idEdicion) => {
  const { count, error } = await supabase
    .from('Inscripciones')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'Participante');
  
  if (error) throw error;
  return count || 0;
};

// Obtener cantidad de usuarios sin ninguna inscripción (pendientes de asignación)
export const getPendingAssignmentsCount = async () => {
  const { data, error } = await supabase
    .from('Usuarios')
    .select('uid, Inscripciones(id)');
    
  if (error) throw error;
  
  // Filtramos los que tienen el array de inscripciones vacío
  const pending = data.filter(u => !u.Inscripciones || u.Inscripciones.length === 0);
  return pending.length;
};


