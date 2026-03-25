// v1.2 - Staff Approval and Mass Participant View
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisInscripciones, getMisParticipantes, getInscripciones } from '../services/inscripcionesService';
import { getMyMetas, createMeta, deleteMeta, updateMeta } from '../services/metasService';
import { useSearchParams, Link } from 'react-router-dom';
import { Target, ChevronLeft, Pencil, Trash2, Check, RotateCcw } from 'lucide-react';

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

  // Determine roles
  const role = profile?.rol_global || 'Participante';
  const isStaff = ['Owner', 'Admin', 'Coach', 'Coordinador'].includes(role);
  const isSuperior = role !== 'Participante';

  // Form for new meta
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
        // 1. Obtener mis propias inscripciones para saber en qué ediciones estoy
        const myIns = await getMisInscripciones(user.id);
        setInscripciones(myIns || []);
        
        if (myIns && myIns.length > 0) {
          const currentIns = myIns[0];
          setSelectedInscripcion(currentIns);

          if (isSuperior && !participantUid) {
            if (isStaff) {
              // Staff: Ver todos los participantes de la edición (filtro participantes solamente)
              const allParticipants = await getInscripciones(currentIns.id_edicion);
              setParticipants(allParticipants?.filter(p => p.rol === 'Participante') || []);
            } else {
              // Senior: Ver solo asignados
              const assigned = await getMisParticipantes(user.id);
              setParticipants(assigned || []);
            }
          } else if (participantUid) {
            // Viendo a un participante específico
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

    if (metas.filter(m => m.eje === ejeAdd).length >= 2) {
       alert("No puedes agregar más de 2 metas por área inicialmente.");
       return;
    }

    try {
      setLoading(true);
      await createMeta({
        id_usuario: user.id,
        id_edicion: selectedInscripcion.id_edicion,
        eje: ejeAdd,
        titulo: tituloAdd,
        descripcion: descAdd,
        estado: 'Pendiente'
      });
      setTituloAdd('');
      setDescAdd('');
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

  const handleUpdateStatus = async (metaId, nuevoEstado) => {
    try {
      setLoading(true);
      await updateMeta(metaId, { estado: nuevoEstado });
      setMetas(prev => prev.map(m => m.id === metaId ? { ...m, estado: nuevoEstado } : m));
    } catch (err) {
      alert("Error al actualizar estado: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingMeta) return;
    try {
      setLoading(true);
      await updateMeta(editingMeta, {
        titulo: editTitulo,
        descripcion: editDesc,
        estado: 'Pendiente' // Se vuelve a poner en pendiente tras edición
      });
      setMetas(prev => prev.map(m => m.id === editingMeta ? { ...m, titulo: editTitulo, descripcion: editDesc, estado: 'Pendiente' } : m));
      setEditingMeta(null);
    } catch (err) {
      alert("Error al actualizar meta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && participants.length === 0 && (participantUid ? !selectedParticipant : true) && inscripciones.length === 0) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  // View 1: List participants (Staff see all, Seniors see assigned)
  if (isSuperior && !participantUid) {
    return (
      <div>
        <h2 style={{ marginBottom: '2rem' }}>{isStaff ? 'Metas de los Participantes' : 'Mis Participantes'}</h2>
        {participants.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No se encontraron participantes asignados.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {participants.map(ins => {
              const p = ins.usuario;
              const name = p.nombre ? `${p.nombre} ${p.apellido}` : p.email.split('@')[0];
              return (
                <Link key={ins.id} to={`?u=${p.uid}`} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s' }}>
                  <div className="avatar" style={{ background: 'var(--primary-color)' }}>{name.substring(0, 2).toUpperCase()}</div>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {participantUid && (
            <Link to="/goals" className="card" style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0 }}>
              <ChevronLeft size={20} />
            </Link>
          )}
          <div>
            <h2 style={{ margin: 0 }}>{participantUid ? `Metas de ${selectedParticipant?.nombre || 'Participante'}` : 'Mis Metas'}</h2>
            {participantUid && <small style={{ color: 'var(--text-muted)' }}>{selectedParticipant?.email}</small>}
          </div>
        </div>
      </div>

      {!participantUid && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '2rem' }}>
          <h4>Nueva Meta</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label>Área</label>
              <select value={ejeAdd} onChange={e => setEjeAdd(e.target.value)} required>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
              <label>Título Corto</label>
              <input type="text" value={tituloAdd} onChange={e => setTituloAdd(e.target.value)} required maxLength={50} placeholder="Ej. Bajar de peso" />
            </div>
            <div className="form-group" style={{ flex: '2 1 300px', marginBottom: 0 }}>
              <label>Descripción detallada</label>
              <input type="text" value={descAdd} onChange={e => setDescAdd(e.target.value)} required placeholder="Ej. Bajar 5 kilos este mes mediante..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading}>+ Agregar</button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {AREAS.map(area => {
          const areaMetas = metas.filter(m => m.eje === area);
          return (
            <div key={area} className="card" style={{ marginBottom: 0, padding: '1.25rem' }}>
              <h4 style={{ color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>{area}</h4>
              <ul style={{ listStyle: 'none', marginTop: '1rem', padding: 0 }}>
                {areaMetas.length === 0 ? (
                  <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin metas definidas.</li>
                ) : (
                  areaMetas.map((meta, idx) => (
                    <li key={meta.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                      {editingMeta === meta.id ? (
                        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input type="text" value={editTitulo} onChange={e => setEditTitulo(e.target.value)} required />
                          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} required style={{ minHeight: '60px' }} />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Guardar</button>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => setEditingMeta(null)}>Cancelar</button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold' }}>{idx + 1}. {meta.titulo}</div>
                              <div style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{meta.descripcion}</div>
                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7rem', color: meta.estado === 'Aprobada' ? '#10b981' : (meta.estado === 'Para Reformular' ? '#ef4444' : '#fbbf24'), textTransform: 'uppercase', fontWeight: 'bold' }}>
                                  {meta.estado || 'Pendiente'}
                                </span>
                              </div>
                            </div>
                            {!participantUid && meta.estado !== 'Aprobada' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => { setEditingMeta(meta.id); setEditTitulo(meta.titulo); setEditDesc(meta.descripcion); }} className="btn-icon"><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(meta.id)} className="btn-icon" style={{ color: 'var(--error-color)' }}><Trash2 size={14} /></button>
                              </div>
                            )}
                          </div>
                          
                          {isStaff && participantUid && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                              <button className="btn btn-primary" style={{ background: '#10b981', fontSize: '0.75rem', padding: '0.3rem 0.6rem', border: 'none' }} onClick={() => handleUpdateStatus(meta.id, 'Aprobada')}>
                                <Check size={14} style={{ marginRight: '0.2rem' }} /> Aprobar
                              </button>
                              <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => handleUpdateStatus(meta.id, 'Para Reformular')}>
                                <RotateCcw size={14} style={{ marginRight: '0.2rem' }} /> Reformular
                              </button>
                            </div>
                          )}
                        </div>
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
