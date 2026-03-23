import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisInscripciones } from '../services/inscripcionesService';
import { getMyMetas } from '../services/metasService';
import { getMyDeclaraciones, createDeclaracion } from '../services/declaracionesService';

export default function Declaraciones() {
  const { user } = useAuth();
  const [inscripciones, setInscripciones] = useState([]);
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [metas, setMetas] = useState([]);
  const [declaraciones, setDeclaraciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [semana, setSemana] = useState(1);
  const [metaSel, setMetaSel] = useState('');
  const [compromiso, setCompromiso] = useState('');
  const [tipoEvi, setTipoEvi] = useState('única vez');

  useEffect(() => {
    if (!user) return;
    getMisInscripciones(user.id).then(data => {
      setInscripciones(data);
      if (data.length > 0) setSelectedInscripcion(data[0]);
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedInscripcion || !user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const metasData = await getMyMetas(selectedInscripcion.id_edicion, user.id);
        const decData = await getMyDeclaraciones(selectedInscripcion.id_edicion, user.id);
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
  }, [selectedInscripcion, user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!metaSel || !compromiso.trim()) return;

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

  if (loading && inscripciones.length === 0) return <div style={{padding:'2rem'}}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Mis Acciones (Declaraciones Semanales)</h2>
      </div>

      {metas.length === 0 ? (
        <div className="card">
          <p>Debes definir tus Metas primero antes de poder declarar acciones semanales.</p>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem' }}>
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
              <label>Compromiso / Acción</label>
              <input type="text" value={compromiso} onChange={e => setCompromiso(e.target.value)} required placeholder="Ej. Ir al gimnasio 3 veces" />
            </div>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label>Evidencia</label>
              <select value={tipoEvi} onChange={e => setTipoEvi(e.target.value)} required style={{width: '100%', padding:'0.75rem', background:'rgba(0,0,0,0.2)', color:'white', borderRadius:'0.5rem', border:'1px solid var(--border-color)'}}>
                <option value="única vez">Única vez (1 foto)</option>
                <option value="múltiples veces">Varias (múltiples fotos)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto', width: 'auto' }} disabled={loading}>
              {loading ? '...' : 'Declarar'}
            </button>
          </div>
        </form>
      )}

      <h4>Historial de Acciones Semanales</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {declaraciones.map(dec => (
          <div key={dec.id_declaracion} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{color:'var(--primary-color)', fontWeight:'bold'}}>Semana {dec.semana_nro}</span>
              <span style={{fontSize:'0.8rem', padding:'0.2rem 0.6rem', borderRadius:'1rem', background: dec.estado_validacion === 'Aprobado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}}>
                {dec.estado_validacion}
              </span>
            </div>
            <p style={{ marginTop:'0.5rem', fontWeight:'500'}}>{dec.descripcion_compromiso}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Meta: {metas.find(m => m.id === dec.id_meta)?.descripcion || 'Desconocida'}
            </p>
            <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0', opacity: 0.5 }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{dec.tipo_evidencia}</span>
               <button className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Subir Evidencia</button>
            </div>
          </div>
        ))}
        {declaraciones.length === 0 && (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No tienes declaraciones aún.</p>
        )}
      </div>
    </div>
  );
}
