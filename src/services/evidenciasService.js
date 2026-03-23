import { supabase } from '../lib/supabase';

// Subir archivo a Supabase Storage y registrar en la DB
export const uploadEvidencia = async (idDeclaracion, file, comentario) => {
  let publicUrl = null;
  
  if (file) {
    const ext = file.name.split('.').pop();
    const filePath = `${idDeclaracion}_${Date.now()}.${ext}`;

    // 1. Subir al storage (Bucket 'evidencias')
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('evidencias')
      .upload(filePath, file);

    if (storageError) throw storageError;

    // 2. Obtener URL publica
    const { data: urlData } = supabase.storage.from('evidencias').getPublicUrl(filePath);
    publicUrl = urlData.publicUrl;
  }

  // 3. Registrar en la tabla Evidencias
  const { data, error } = await supabase
    .from('Evidencias')
    .insert([{
      id_declaracion: idDeclaracion,
      url_foto_evidencia: publicUrl,
      comentario_participante: comentario,
      estado_validacion: 'Pendiente'
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

// Aprobar/Rechazar evidencia (Seniors/Papisado)
export const revisarEvidencia = async (idEvidencia, idValidador, estadoNuevo) => {
  const { data, error } = await supabase
    .from('Evidencias')
    .update({ 
      estado_validacion: estadoNuevo,
      validado_por: idValidador
    })
    .eq('id_evidencia', idEvidencia)
    .select()
    .single();
    
  if (error) throw error;
  
  // Reflejar estado en la Declaración
  if (estadoNuevo === 'Aprobado') {
     await supabase.from('Declaraciones').update({ estado_validacion: 'Aprobado' }).eq('id_declaracion', data.id_declaracion);
  } else if (estadoNuevo === 'Rechazado') {
     await supabase.from('Declaraciones').update({ estado_validacion: 'Rechazado' }).eq('id_declaracion', data.id_declaracion);
  }
  
  return data;
};

// Obtener evidencias pendientes para el equipo del Senior logueado
export const getEvidenciasPendientes = async (idSenior) => {
  // Query compleja para traer las evidencias de las declaraciones de los participantes a cargo
  const { data, error } = await supabase
    .from('Evidencias')
    .select(`
      *,
      declaracion:Declaraciones!inner(
        *,
        meta:Metas!inner(
           *,
           usuario:Usuarios!inner(nombre, apellido)
        )
      )
    `)
    .eq('estado_validacion', 'Pendiente')
    .order('fecha_carga', { ascending: false });
    
  // En frontend filtraremos temporalmente el equipo si RLS no lo está haciendo estrictamente 
  if (error) throw error;
  return data;
};
