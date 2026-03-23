import { supabase } from '../lib/supabase';

// Obtener todas las ediciones
export const getEdiciones = async () => {
  const { data, error } = await supabase
    .from('Ediciones')
    .select(`
      *,
      coach:Usuarios!id_coach(nombre, apellido),
      coordinador:Usuarios!id_coordinador(nombre, apellido)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Crear una edición
export const createEdicion = async (edicionData) => {
  const { data, error } = await supabase
    .from('Ediciones')
    .insert([edicionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Actualizar una edición
export const updateEdicion = async (id, edicionData) => {
  const { data, error } = await supabase
    .from('Ediciones')
    .update(edicionData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Cambiar el estado de la edición (Seniors -> Unificado)
export const updateEdicionState = async (id, newState) => {
  return updateEdicion(id, { estado: newState });
};
