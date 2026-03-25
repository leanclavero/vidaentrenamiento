import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisInscripciones, getMisParticipantes } from '../services/inscripcionesService';
import { getMyMetas } from '../services/metasService';
import { getMyDeclaraciones, createDeclaracion } from '../services/declaracionesService';
import { uploadEvidencia } from '../services/evidenciasService';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckSquare } from 'lucide-react';

export default function Declaraciones() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const participantUid = searchParams.get('u');
  
  const [participants, setParticipants] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [metas, setMetas] = useState([]);
  const [declaraciones, setDeclaraciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine role
  const role = profile?.rol_global || 'Participante';
  const isSenior = role !== 'Participante';

  // Declaracion Form
  const [semana, setSemana] = useState(1);
  const [metaSel, setMetaSel] = useState('');
  const [compromiso, setCompromiso] = useState('');
  const [tipoEvi, setTipoEvi] = useState('única vez');

  // Evidencia Form
  const [eviActiveId, setEviActiveId] = useState(null);
  const [eviFile, setEviFile] = useState(null);
  const [eviComment, setEviComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    
    const init = async () => {
      setLoading(true);
      try {
        if (isSenior && !participantUid) {
          // Senior view: list participants
          const data = await getMisParticipantes(user.id);
          setParticipants(data || []);
        } else {
          // Participant view or Senior viewing a specific participant
          const targetUid = participantUid || user.id;
          const data = await getMisInscripciones(targetUid);
          setInscripciones(data || []);
          if (data && data.length > 0) {
            setSelectedInscripcion(data[0]);
            if (participantUid) setSelectedParticipant(data[0].usuario);
          }
        }
      } catch (err) {
        console.error("Error in init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, participantUid, isSenior]);

  useEffect(() => {
    if (!selectedInscripcion || !user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const targetUid = participantUid || user.id;
        const metasData = await getMyMetas(selectedInscripcion.id_edicion, targetUid);
        const decData = await getMyDeclaraciones(selectedInscripcion.id_edicion, targetUid);
        setMetas(metasData || []);
        if (metasData?.length > 0) setMetaSel(metasData[0].id);
        setDeclaraciones(decData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedInscripcion, user, participantUid]);

  const handleCreateDec = async (e) => {
    e.preventDefault();
    if (!metaSel || !compromiso.trim() || participantUid) return;

    try {
      setLoading(true);
      await createDeclaracion({
        id_meta: metaSel,
        semana_nro: semana,
        descripcion_compromiso: compromiso,
        tipo_evidencia: tipoEvi
      });
      setCompromiso('');
      
      const targetUid = participantUid || user.id;
      const decData = await getMyDeclaraciones(selectedInscripcion.id_edicion, targetUid);
      setDeclaraciones(decData || []);
    } catch (err) {
      alert("Error al declarar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvi = async (e) => {
    e.preventDefault();
    if (!eviActiveId || participantUid) return;
    try {
      setUploading(true);
      await uploadEvidencia(eviActiveId, eviFile, eviComment);
      alert("Evidencia subida correctamente y enviada a validación.");
      setEviActiveId(null);
      setEviFile(null);
      setEviComment('');
      
      const targetUid = participantUid || user.id;
      const decData = await getMyDeclaraciones(selectedInscripcion.id_edicion, targetUid);
      setDeclaraciones(decData || []);
    } catch (err) {
      alert("Error al subir evidencia. ¿Habéis configurado el bucket público 'evidencias' en Supabase Storage? Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading && participants.length === 0 && inscripciones.length === 0) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  // View 1: Senior listing their participants
  if (isSenior && !participantUid) {
    return (
      <div>
        <h2 style={{ marginBottom: '2rem' }}>Acciones de Participantes</h2>
        {participants.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No tienes participantes asignados para ver sus acciones.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {participants.map(ins => {
              const p = ins.usuario;
              const name = p.nombre && p.nombre !== 'Usuario' ? `${p.nombre} ${p.apellido}` : p.email.split('@')[0];
              return (
                <Link key={ins.id} to={`?u=${p.uid}`} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s' }}>
                  <div className="avatar">{name.substring(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'var(--text-main)' }}>{name}</h4>
                    <small style={{ color: 'var(--text-muted)' }}>{p.email}</small>
                  </div>
                  <CheckSquare size={20} color="var(--primary-color)" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // View 2: Empty state for participants
  if (!loading && inscripciones.length === 0) {
    return (
      <div className="card">
        <h4>No se encontraron ediciones</h4>
        <p style={{ color: 'var(--text-muted)' }}>Este usuario no está inscrito en ninguna edición activa.</p>
        {isSenior && <Link to="/actions" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Volver</Link>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {participantUid && (
            <Link to="/actions" className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </Link>
          )}
          <div>
            <h2 style={{ margin: 0 }}>{participantUid ? `Acciones de ${selectedParticipant?.nombre || 'Participante'}` : 'Mis Acciones & Evidencias'}</h2>
            {participantUid && <small style={{ color: 'var(--text-muted)' }}>{selectedParticipant?.email}</small>}
          </div>
        </div>
      </div>

      {!participantUid && (
        metas.length === 0 ? (
          <div className="card">
            <p>Debes definir tus Metas primero antes de poder declarar acciones semanales.</p>
          </div>
        ) : (
          <form onSubmit={handleCreateDec} className="card" style={{ marginBottom: '2rem' }}>
            <h4>Declarar Nueva Acción</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
                <label>Semana Nro</label>
                <input type="number" min="1" max="50" value={semana} onChange={e => setSemana(parseInt(e.target.value))} required />
              </div>
              <div className="form-group" style={{ flex: '2 1 200px', marginBottom: 0 }}>
                <label>Meta Asociada</label>
                <select value={metaSel} onChange={e => setMetaSel(e.target.value)} required style={{width: '100%', padding:'0.75rem', background:'rgba(0,0,0,0.2)', color:'white', borderRadius:'0.5rem', border:'1px solid var(--border-color)'}}>
                  {metas.map(m => <option key={m.id} value={m.id}>{m.eje} - {m.descripcion.substring(0,30)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: '3 1 300px', marginBottom: 0 }}>
                <label>Acción / Compromiso</label>
                <input type="text" value={compromiso} onChange={e => setCompromiso(e.target.value)} required placeholder="Ej. Ir al gimnasio 3 veces" />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                <label>Esperado</label>
                <select value={tipoEvi} onChange={e => setTipoEvi(e.target.value)} required style={{width: '100%', padding:'0.75rem', background:'rgba(0,0,0,0.2)', color:'white', borderRadius:'0.5rem', border:'1px solid var(--border-color)'}}>
                  <option value="única vez">Única vez (1 foto)</option>
                  <option value="múltiples veces">Varias (múltiples fotos)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto', width: 'auto' }} disabled={loading}>
                {loading ? '...' : '+ Declarar'}
              </button>
            </div>
          </form>
        )
      )}

      <h4>Historial de Acciones Semanales</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {declaraciones.map(dec => {
           const meta = metas.find(m => m.id === dec.id_meta);
           const eviReciente = dec.evidencias && dec.evidencias.length > 0 ? dec.evidencias[dec.evidencias.length - 1] : null;

           return (
            <div key={dec.id_declaracion} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{color:'var(--primary-color)', fontWeight:'bold'}}>Semana {dec.semana_nro}</span>
                <span style={{fontSize:'0.8rem', padding:'0.2rem 0.6rem', borderRadius:'1rem', background: dec.estado_validacion === 'Aprobado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}}>
                  {dec.estado_validacion}
                </span>
              </div>
              <p style={{ marginTop:'0.5rem', fontWeight:'500'}}>{dec.descripcion_compromiso}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Meta: {meta?.descripcion || 'Desconocida'}
              </p>
              <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0', opacity: 0.5 }} />
              
              {eviActiveId === dec.id_declaracion ? (
                <form onSubmit={handleUploadEvi} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div className="form-group">
                    <label>Adjuntar Foto / Archivo (Requerirá Bucket)</label>
                    <input type="file" ref={fileInputRef} onChange={e => setEviFile(e.target.files[0])} accept="image/*" />
                  </div>
                  <div className="form-group">
                    <label>Comentario (Opcional)</label>
                    <input type="text" value={eviComment} onChange={e => setEviComment(e.target.value)} placeholder="Logrado!" />
                  </div>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Subiendo...' : 'Enviar Evidencia'}</button>
                    <button type="button" className="btn btn-secondary" onClick={()=>setEviActiveId(null)} disabled={uploading}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div>
                   {eviReciente && (
                      <div style={{marginBottom:'1rem', fontSize:'0.85rem', background:'rgba(255,255,255,0.02)', padding:'0.75rem', borderRadius:'0.5rem'}}>
                        <div style={{color:'var(--text-muted)', marginBottom:'0.25rem'}}>Última evidencia ({eviReciente.estado_validacion}):</div>
                        {eviReciente.url_foto_evidencia ? <a href={eviReciente.url_foto_evidencia} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)'}}>👉 Ver Foto</a> : <span>Archivo subiendo/pendiente</span>}
                        {eviReciente.comentario_participante && <div style={{fontStyle:'italic', marginTop:'0.25rem'}}>"{eviReciente.comentario_participante}"</div>}
                      </div>
                   )}
                   {(!participantUid && dec.estado_validacion !== 'Aprobado') && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{dec.tipo_evidencia}</span>
                       <button onClick={()=>setEviActiveId(dec.id_declaracion)} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem', border:'1px solid var(--primary-color)', color:'var(--primary-color)' }}>
                         + Subir Foto
                       </button>
                     </div>
                   )}
                </div>
              )}
            </div>
           )
        })}
        {declaraciones.length === 0 && (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No tienes declaraciones aún.</p>
        )}
      </div>
    </div>
  );
}
