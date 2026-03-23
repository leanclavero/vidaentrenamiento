import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisInscripciones } from '../services/inscripcionesService';
import { getMyMetas, createMeta, deleteMeta } from '../services/metasService';

const AREAS = ['Personal', 'Relaciones', 'Profesional', 'Comunitario', 'Finanzas', 'Enrolamiento'];

export default function Metas() {
  const { user } = useAuth();
  const [inscripciones, setInscripciones] = useState([]);
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [ejeAdd, setEjeAdd] = useState('Personal');
  const [descAdd, setDescAdd] = useState('');

  useEffect(() => {
    if (!user) return;
    getMisInscripciones(user.id).then(data => {
      setInscripciones(data);
      if (data.length > 0) {
        setSelectedInscripcion(data[0]);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedInscripcion || !user) return;
    loadMetas();
  }, [selectedInscripcion, user]);

  const loadMetas = async () => {
    try {
      setLoading(true);
      const data = await getMyMetas(selectedInscripcion.id_edicion, user.id);
      setMetas(data || []);
    } catch (err) {
      console.error("Error al cargar metas", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedInscripcion || !descAdd.trim()) return;

    // Verificar límite
    const metasEnEje = metas.filter(m => m.eje === ejeAdd);
    if (metasEnEje.length >= 2 && !metasEnEje[0]?.autorizar_metas_extra) {
       alert("No puedes agregar más de 2 metas por área inicialmente sin autorización del staff.");
       return;
    }

    try {
      setLoading(true);
      await createMeta({
        id_usuario: user.id,
        id_edicion: selectedInscripcion.id_edicion,
        eje: ejeAdd,
        descripcion: descAdd
      });
      setDescAdd('');
      await loadMetas();
    } catch (err) {
      alert("Error al guardar meta: " + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (metaId) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta meta? Solo puedes hacerlo si aún no declaraste acciones sobre ella.")) return;
    try {
      setLoading(true);
      await deleteMeta(metaId);
      await loadMetas();
    } catch (err) {
      alert("Error al eliminar meta: " + err.message);
      setLoading(false);
    }
  }

  if (loading && inscripciones.length === 0) return <div style={{padding:'2rem'}}>Cargando perfil...</div>;

  if (inscripciones.length === 0) {
    return (
      <div>
        <div className="card">
          <h4>No tienes Ediciones Asignadas</h4>
          <p style={{color: 'var(--text-muted)'}}>Debes solicitar un link de invitación para unirte a una Edición y comenzar a cargar tus metas.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Mis Metas</h2>
        {inscripciones.length > 1 && (
          <select 
            value={selectedInscripcion?.id} 
            onChange={e => setSelectedInscripcion(inscripciones.find(ins => ins.id === e.target.value))}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
          >
            {inscripciones.map(ins => (
              <option key={ins.id} value={ins.id}>{ins.edicion?.nombre_grupo}</option>
            ))}
          </select>
        )}
      </div>

      <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem' }}>
        <h4>Nueva Meta</h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label>Área Requerida</label>
            <select value={ejeAdd} onChange={e => setEjeAdd(e.target.value)} required style={{width: '100%', padding:'0.75rem', background:'rgba(0,0,0,0.2)', color:'white', borderRadius:'0.5rem', border:'1px solid var(--border-color)'}}>
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: '2 1 300px', marginBottom: 0 }}>
            <label>Descripción de la Meta</label>
            <input type="text" value={descAdd} onChange={e => setDescAdd(e.target.value)} required placeholder="Ej. Bajar 5 kilos este mes" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto', width: 'auto' }} disabled={loading}>
            {loading ? '...' : '+ Agregar'}
          </button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {AREAS.map(area => {
          const areaMetas = metas.filter(m => m.eje === area);
          const maxReached = areaMetas.length >= 2 && (!areaMetas[0]?.autorizar_metas_extra);
          return (
            <div key={area} className="card" style={{ marginBottom: 0, padding: '1.25rem', border: maxReached ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {area} 
                <span style={{fontSize:'0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', color:'var(--text-muted)'}}>
                  {areaMetas.length}/2
                </span>
              </h4>
              <ul style={{ listStyle: 'none', marginTop: '1rem', padding: 0 }}>
                {areaMetas.length === 0 ? (
                  <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>Sin metas definidas.</li>
                ) : (
                  areaMetas.map((meta, idx) => (
                    <li key={meta.id} style={{ marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      <div style={{flex: 1}}>
                        <strong style={{color: 'var(--text-muted)', marginRight: '0.5rem'}}>{idx + 1}.</strong> 
                        {meta.descripcion}
                      </div>
                      <button onClick={()=>handleDelete(meta.id)} style={{background:'transparent', color:'var(--error-color)', border:'none', cursor:'pointer', padding: '0.2rem', opacity: 0.7}} title="Eliminar meta">✕</button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  );
}
