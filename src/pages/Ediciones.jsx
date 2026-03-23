import React, { useEffect, useState } from 'react';
import { getEdiciones, createEdicion, updateEdicion } from '../services/edicionesService';
import { useAuth } from '../context/AuthContext';

export default function Ediciones() {
  const { profile } = useAuth();
  const [ediciones, setEdiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre_grupo: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  const loadEdiciones = async () => {
    try {
      setLoading(true);
      const data = await getEdiciones();
      setEdiciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEdiciones();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ nombre_grupo: '', fecha_inicio: '', fecha_fin: '' });
    setIsFormOpen(!isFormOpen);
  };

  const handleEdit = (ed) => {
    setIsFormOpen(true);
    setEditingId(ed.id);
    setFormData({
      nombre_grupo: ed.nombre_grupo,
      fecha_inicio: ed.fecha_inicio || '',
      fecha_fin: ed.fecha_fin || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await updateEdicion(editingId, formData);
      } else {
        await createEdicion(formData);
      }
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ nombre_grupo: '', fecha_inicio: '', fecha_fin: '' });
      loadEdiciones();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && ediciones.length === 0) return <div>Cargando ediciones...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Gestión de Ediciones</h2>
        {(profile?.rol_global === 'Owner' || profile?.rol_global === 'Admin' || true) && (
          <button className="btn btn-primary" style={{ width: 'auto', padding: '0.6rem 1.2rem' }} onClick={handleOpenCreate}>
            {isFormOpen && !editingId ? 'Cancelar' : '+ Nueva Edición'}
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '2rem', border: editingId ? '1px solid var(--primary-color)' : 'none' }}>
          <h4>{editingId ? 'Editar Edición' : 'Crear Nueva Edición'}</h4>
          <div className="form-group">
            <label>Nombre del Grupo</label>
            <input type="text" name="nombre_grupo" value={formData.nombre_grupo} onChange={handleChange} required placeholder="Ej: Generación 4" />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Inicio</label>
              <input type="date" name="nombre_grupo_2" style={{display:'none'}}/>
              <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Fin</label>
              <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} />
            </div>
          </div>
          <div style={{display:'flex', gap:'1rem'}}>
             <button type="submit" className="btn btn-primary" disabled={loading} style={{width:'auto', padding:'0.5rem 1rem'}}>
               {loading ? 'Guardando...' : (editingId ? 'Actualizar Edición' : 'Crear Edición')}
             </button>
             {editingId && (
                <button type="button" className="btn btn-secondary" onClick={()=>setIsFormOpen(false)} style={{width:'auto', padding:'0.5rem 1rem'}}>
                  Cancelar Edición
                </button>
             )}
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {ediciones.map((ed) => (
          <div key={ed.id} className="card" style={{ marginBottom: '0' }}>
            <h4>{ed.nombre_grupo}</h4>
            <div style={{ margin: '1rem 0', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ display: 'inline-block', width: '90px' }}>Estado:</span>
                <strong style={{ color: ed.estado === 'Unificado' ? '#8b5cf6' : '#10b981', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                  {ed.estado}
                </strong>
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '90px' }}>Inicio:</span>
                <span style={{ color: 'var(--text-main)'}}>{ed.fecha_inicio || '-'}</span>
              </div>
              <div style={{ marginBottom: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '90px' }}>Coach:</span>
                <span style={{ color: 'var(--text-main)'}}>{ed.coach ? `${ed.coach.nombre} ${ed.coach.apellido}` : 'Sin asignar'}</span>
              </div>
              <div>
                <span style={{ display: 'inline-block', width: '90px' }}>Coordinador:</span>
                <span style={{ color: 'var(--text-main)'}}>{ed.coordinador ? `${ed.coordinador.nombre} ${ed.coordinador.apellido}` : 'Sin asignar'}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" onClick={() => handleEdit(ed)} style={{ padding: '0.6rem', fontSize: '0.85rem', flex: 1, border: '1px solid var(--primary-color)' }}>Editar Detalles</button>
            </div>
          </div>
        ))}
        {ediciones.length === 0 && !isFormOpen && (
          <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No hay ediciones registradas. Crea una para comenzar.</p>
        )}
      </div>
    </div>
  );
}
