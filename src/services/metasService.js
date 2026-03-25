import { supabase } from '../lib/supabase';

// Obtener metas por edición para el usuario logueado
export const getMyMetas = async (idEdicion, idUsuario) => {
  const { data, error } = await supabase
    .from('Metas')
    .select('*')
    .eq('id_edicion', idEdicion)
    .eq('id_usuario', idUsuario);
  if (error) throw error;
  return data;
};

// Insertar metas
export const createMeta = async (metaData) => {
  const { data, error } = await supabase
    .from('Metas')
    .insert([metaData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Eliminar meta
export const deleteMeta = async (metaId) => {
  const { error } = await supabase
    .from('Metas')
    .delete()
    .eq('id', metaId);
  if (error) throw error;
  return true;
};
// Actualizar meta
export const updateMeta = async (metaId, updates) => {
  const { data, error } = await supabase
    .from('Metas')
    .update(updates)
    .eq('id', metaId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Obtener todas las metas pendientes de aprobación (para Staff)
export const getMetasPendientes = async () => {
  const { data, error } = await supabase
    .from('Metas')
    .select('*, usuario:Usuarios(nombre, apellido)')
    .eq('estado', 'Pendiente');
  if (error) throw error;

  return data;
};

