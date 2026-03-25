// v1.3 - Staff Mass View for Actions
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisInscripciones, getMisParticipantes, getInscripciones } from '../services/inscripcionesService';
import { getMyMetas } from '../services/metasService';
import { getMyDeclaraciones, createDeclaracion } from '../services/declaracionesService';
import { uploadEvidencia } from '../services/evidenciasService';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft, CheckSquare, Upload, FileText } from 'lucide-react';

const compressImage = (file, maxKB = 100) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > height) { if (width > maxDim) { height *= maxDim / width; width = maxDim; } }
        else { if (height > maxDim) { width *= maxDim / height; height = maxDim; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.7;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > maxKB * 1024 * 1.33 && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        fetch(dataUrl).then(res => res.blob()).then(blob => {
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
          resolve(newFile);
        });
      };
    };
  });
};

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

  // Determine roles
  const role = profile?.rol_global || 'Participante';
  const isStaff = ['Owner', 'Admin', 'Coach', 'Coordinador'].includes(role);
  const isSuperior = role !== 'Participante';

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
        const myIns = await getMisInscripciones(user.id);
        setInscripciones(myIns || []);
        
        if (myIns && myIns.length > 0) {
          const currentIns = myIns[0];
          setSelectedInscripcion(currentIns);

          if (isSuperior && !participantUid) {
            if (isStaff) {
              const allParticipants = await getInscripciones(currentIns.id_edicion);
              setParticipants(allParticipants?.filter(p => p.rol === 'Participante') || []);
            } else {
              const assigned = await getMisParticipantes(user.id);
              setParticipants(assigned || []);
            }
          } else if (participantUid) {
            const targetIns = await getMisInscripciones(participantUid);
            if (targetIns && targetIns.length > 0) {
              setSelectedParticipant(targetIns[0].usuario);
            }
          }
        }
      } catch (err) {
        console.error("Error in init:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user, participantUid, isSuperior, isStaff]);

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
      const decData = await getMyDeclaraciones(selectedInscripcion.id_edicion, user.id);
      setDeclaraciones(decData || []);
    } catch (err) {
      alert("Error al declarar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEvi = async (e) => {
    e.preventDefault();
    if (!eviActiveId || !eviFile || participantUid) return;
    try {
      setUploading(true);
      const compressedFile = await compressImage(eviFile, 100);
      await uploadEvidencia(eviActiveId, compressedFile, eviComment);
      alert("Evidencia subida correctamente y enviada a revisión.");
      setEviActiveId(null); setEviFile(null); setEviComment('');
      const decData = await getMyDeclaraciones(selectedInscripcion.id_edicion, user.id);
      setDeclaraciones(decData || []);
    } catch (err) {
      alert("Error al subir evidencia: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading && participants.length === 0 && (participantUid ? !selectedParticipant : true) && inscripciones.length === 0) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  if (isSuperior && !participantUid) {
    return (
      <div>
        <h2 style={{ marginBottom: '2rem' }}>{isStaff ? 'Acciones de los Participantes' : 'Mis Participantes'}</h2>
        {participants.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No se encontraron participantes.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {participants.map(ins => {
              const p = ins.usuario;
              const name = p.nombre ? `${p.nombre} ${p.apellido}` : p.email.split('@')[0];
              return (
                <Link key={ins.id} to={`?u=${p.uid}`} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="avatar" style={{ background: 'var(--primary-color)' }}>{name.substring(0, 2).toUpperCase()}</div>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {participantUid && (
            <Link to="/actions" className="card" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom:0 }}>
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
            <p>Debes definir tus Metas primero.</p>
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
                  {metas.map(m => <option key={m.id} value={m.id}>[{m.eje}] {m.titulo || m.descripcion.substring(0,30)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: '3 1 300px', marginBottom: 0 }}>
                <label>Acción / Compromiso</label>
                <input type="text" value={compromiso} onChange={e => setCompromiso(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                <label>Ejecución</label>
                <select value={tipoEvi} onChange={e => setTipoEvi(e.target.value)} required>
                  <option value="única vez">1 vez</option>
                  <option value="múltiples veces">Varias veces</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>+ Declarar</button>
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
                <span style={{fontSize:'0.8rem', padding:'0.2rem 0.6rem', borderRadius:'1rem', background: 'rgba(255,255,255,0.05)'}}>
                  {dec.estado_validacion || 'Pendiente'}
                </span>
              </div>
              <p style={{ marginTop:'0.5rem', fontWeight:'500'}}>{dec.descripcion_compromiso}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Meta Asociada: {meta ? `[${meta.eje}] ${meta.titulo || meta.descripcion.substring(0,30)}` : 'Desconocida'}
              </p>
              
              {eviActiveId === dec.id_declaracion ? (
                <form onSubmit={handleUploadEvi} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label>Adjuntar Foto</label>
                    <input type="file" ref={fileInputRef} onChange={e => setEviFile(e.target.files[0])} accept="image/*" />
                  </div>
                  <div className="form-group">
                    <label>Comentario</label>
                    <input type="text" value={eviComment} onChange={e => setEviComment(e.target.value)} />
                  </div>
                  <div style={{display:'flex', gap:'0.5rem'}}>
                    <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Procesando...' : 'Enviar'}</button>
                    <button type="button" className="btn btn-secondary" onClick={()=>setEviActiveId(null)}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div>
                   {eviReciente && (
                      <div style={{marginTop:'1rem', fontSize:'0.85rem', background:'rgba(255,255,255,0.02)', padding:'0.75rem', borderRadius:'0.5rem'}}>
                        <div style={{color:'var(--text-muted)', marginBottom:'0.25rem'}}>Última evidencia:</div>
                        {eviReciente.url_foto_evidencia ? <a href={eviReciente.url_foto_evidencia} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                           Ver archivo
                        </a> : <span>Archivo en proceso</span>}
                      </div>
                   )}
                   {(!participantUid && dec.estado_validacion !== 'Aprobado') && (
                     <button onClick={()=>setEviActiveId(dec.id_declaracion)} className="btn btn-secondary" style={{ marginTop: '1rem', fontSize:'0.8rem' }}>
                       + Subir Foto
                     </button>
                   )}
                </div>
              )}
            </div>
           )
        })}
      </div>
    </div>
  );
}
