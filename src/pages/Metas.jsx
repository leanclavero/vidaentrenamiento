// v1.1 - Added Goal Titles and Refined Editing
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisInscripciones, getMisParticipantes } from '../services/inscripcionesService';
import { getMyMetas, createMeta, deleteMeta, updateMeta } from '../services/metasService';
import { useSearchParams, Link } from 'react-router-dom';
import { Target, ChevronLeft, User, Pencil, Trash2 } from 'lucide-react';
/* ... rest of imports ... */


const AREAS = ['Personal', 'Relaciones', 'Profesional', 'Comunitario', 'Finanzas', 'Enrolamiento'];

export default function Metas() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const participantUid = searchParams.get('u');
  
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [selectedInscripcion, setSelectedInscripcion] = useState(null);
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine role
  const role = profile?.rol_global || 'Participante';
  const isSenior = role !== 'Participante';

  // Form for new meta (only for participants viewing their own)
  const [ejeAdd, setEjeAdd] = useState('Personal');
  const [tituloAdd, setTituloAdd] = useState('');
  const [descAdd, setDescAdd] = useState('');
  
  // State for editing
  const [editingMeta, setEditingMeta] = useState(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editDesc, setEditDesc] = useState('');

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
            if (participantUid) {
              setSelectedParticipant(data[0].usuario);
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
  }, [user, participantUid, isSenior]);

  useEffect(() => {
    if (!selectedInscripcion) return;
    const fetchMetas = async () => {
      setLoading(true);
      try {
        const targetUid = participantUid || user.id;
        const data = await getMyMetas(selectedInscripcion.id_edicion, targetUid);
        setMetas(data || []);
      } catch (err) {
        console.error("Error fetching metas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetas();
  }, [selectedInscripcion, participantUid, user.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedInscripcion || !descAdd.trim()) return;

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
        titulo: tituloAdd,
        descripcion: descAdd
      });
      setTituloAdd('');
      setDescAdd('');
      // Reload
      const data = await getMyMetas(selectedInscripcion.id_edicion, user.id);
      setMetas(data || []);
    } catch (err) {
      alert("Error al guardar meta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (metaId) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta meta?")) return;
    try {
      setLoading(true);
      await deleteMeta(metaId);
      setMetas(prev => prev.filter(m => m.id !== metaId));
    } catch (err) {
      alert("Error al eliminar meta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (meta) => {
    setEditingMeta(meta.id);
    setEditTitulo(meta.titulo || '');
    setEditDesc(meta.descripcion || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMeta) return;
    try {
      setLoading(true);
      await updateMeta(editingMeta, {
        titulo: editTitulo,
        descripcion: editDesc
      });
      setMetas(prev => prev.map(m => m.id === editingMeta ? { ...m, titulo: editTitulo, descripcion: editDesc } : m));
      setEditingMeta(null);
    } catch (err) {
      alert("Error al actualizar meta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && participants.length === 0 && inscripciones.length === 0) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  // View 1: Senior listing their participants
  if (isSenior && !participantUid) {
    return (
      <div>
        <h2 style={{ marginBottom: '2rem' }}>Metas de Participantes</h2>
        {participants.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No tienes participantes asignados para ver sus metas.</p>
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
                  <Target size={20} color="var(--primary-color)" />
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
        {isSenior && <Link to="/goals" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>Volver</Link>}
      </div>
    );
  }

  // View 3: Goals display (own or participant's)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {participantUid && (
            <Link to="/goals" className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </Link>
          )}
          <div>
            <h2 style={{ margin: 0 }}>{participantUid ? `Metas de ${selectedParticipant?.nombre || 'Participante'}` : 'Mis Metas'}</h2>
            {participantUid && <small style={{ color: 'var(--text-muted)' }}>{selectedParticipant?.email}</small>}
          </div>
        </div>
        
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

      {!participantUid && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem' }}>
          <h4>Nueva Meta</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label>Área</label>
              <select value={ejeAdd} onChange={e => setEjeAdd(e.target.value)} required 
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', color: 'white', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>Título (Máx 3 palabras)</label>
              <input type="text" value={tituloAdd} onChange={e => setTituloAdd(e.target.value)} required placeholder="Ej. Bajar de peso" />
            </div>
            <div className="form-group" style={{ flex: '2 1 300px', marginBottom: 0 }}>
              <label>Descripción detallada</label>
              <input type="text" value={descAdd} onChange={e => setDescAdd(e.target.value)} required placeholder="Ej. Bajar 5 kilos este mes mediante dieta y ejercicio" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ flex: '0 0 auto', width: 'auto' }} disabled={loading}>
              {loading ? '...' : '+ Agregar'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {AREAS.map(area => {
          const areaMetas = metas.filter(m => m.eje === area);
          const maxReached = areaMetas.length >= 2 && (!areaMetas[0]?.autorizar_metas_extra);
          return (
            <div key={area} className="card" style={{ marginBottom: 0, padding: '1.25rem', border: (maxReached && !participantUid) ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)' }}>
              <h4 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {area} 
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '1rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                  {areaMetas.length}/2
                </span>
              </h4>
              <ul style={{ listStyle: 'none', marginTop: '1rem', padding: 0 }}>
                {areaMetas.length === 0 ? (
                  <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>Sin metas definidas.</li>
                ) : (
                  areaMetas.map((meta, idx) => (
                    <li key={meta.id} style={{ marginBottom: '0.75rem', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                      {editingMeta === meta.id ? (
                        <form onSubmit={handleUpdate} style={{ width: '100%' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Título (Corto)</label>
                          <input type="text" value={editTitulo} onChange={e => setEditTitulo(e.target.value)} required placeholder="Título" style={{ marginBottom: '0.5rem', width: '100%' }} />
                          
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Descripción {meta.estado === 'Cerrada' ? '(Protegida - Solo Staff)' : ''}
                          </label>
                          <textarea 
                            value={editDesc} 
                            onChange={e => setEditDesc(e.target.value)} 
                            required 
                            disabled={meta.estado === 'Cerrada'}
                            style={{ 
                              width: '100%', 
                              minHeight: '60px', 
                              borderRadius: '0.5rem', 
                              padding: '0.5rem', 
                              background: meta.estado === 'Cerrada' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', 
                              color: meta.estado === 'Cerrada' ? 'var(--text-muted)' : 'white', 
                              border: '1px solid var(--border-color)',
                              cursor: meta.estado === 'Cerrada' ? 'not-allowed' : 'text'
                            }} 
                          />
                          
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Guardar Cambios</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setEditingMeta(null)} style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ display: 'block', color: 'var(--primary-color)', marginBottom: '0.2rem', fontSize: '1rem' }}>
                                {idx + 1}. {meta.titulo || 'Meta sin título'}
                              </strong> 
                              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', opacity: 0.9 }}>{meta.descripcion}</span>
                              {meta.estado === 'Cerrada' && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--error-color)', padding: '0.1rem 0.4rem', border: '1px solid var(--error-color)', borderRadius: '0.3rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Consolidada</span>
                                </div>
                              )}
                            </div>
                            {!participantUid && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleStartEdit(meta)} className="btn-icon" style={{ color: 'var(--primary-color)' }} title="Editar meta"><Pencil size={16} /></button>
                                {meta.estado !== 'Cerrada' && (
                                  <button onClick={() => handleDelete(meta.id)} className="btn-icon" style={{ color: 'var(--error-color)' }} title="Eliminar meta"><Trash2 size={16} /></button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
