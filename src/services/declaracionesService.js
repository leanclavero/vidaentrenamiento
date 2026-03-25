import { supabase } from '../lib/supabase';

// Obtener todas las declaraciones de las metas de un usuario (para una edición)
// Como la DB relaciona Declaraciones > Metas, agruparemos en frontend
export const getMyDeclaraciones = async (idEdicion, idUsuario) => {
  const { data, error } = await supabase
    .from('Declaraciones')
    .select(`
      *,
      meta:Metas!inner(*),
      evidencias:Evidencias(*)
    `)
    .eq('meta.id_edicion', idEdicion)
    .eq('meta.id_usuario', idUsuario)
    .order('semana_nro', { ascending: true });
    
  if (error) throw error;
  return data;
};

// Crear una declaración semanal
export const createDeclaracion = async (declaracionData) => {
  const { data, error } = await supabase
    .from('Declaraciones')
    .insert([declaracionData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Actualizar una declaración (solo posible si no está aprobada y dentro del tiempo)
export const updateDeclaracion = async (idDeclaracion, updates) => {
  const { data, error } = await supabase
    .from('Declaraciones')
    .update(updates)
    .eq('id_declaracion', idDeclaracion)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Obtener cantidad total de declaraciones (Acciones) de una edición
export const getDeclaracionesCount = async (idEdicion) => {
  const { count, error } = await supabase
    .from('Declaraciones')
    .select('*', { count: 'exact', head: true });
    
  if (error) throw error;
  return count || 0;
};

