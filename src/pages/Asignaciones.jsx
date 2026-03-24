import React, { useEffect, useState } from 'react';
import { getAllUsersWithEnrollments, assignUserToEdition, removeUserFromEdition } from '../services/asignacionesService';
import { getEdiciones } from '../services/edicionesService';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, UserCheck, Shield } from 'lucide-react';

export default function Asignaciones() {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [ediciones, setEdiciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal / Selection states
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignmentData, setAssignmentData] = useState({
    id_edicion: '',
    rol: 'Participante'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, editionsData] = await Promise.all([
        getAllUsersWithEnrollments(),
        getEdiciones()
      ]);
      setUsers(usersData);
      setEdiciones(editionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUser || !assignmentData.id_edicion) return;

    try {
      setLoading(true);
      await assignUserToEdition(selectedUser.uid, assignmentData.id_edicion, assignmentData.rol);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUnassign = async (inscripcionId) => {
    if (!confirm('¿Estás seguro de quitar a este usuario de la edición?')) return;
    try {
      setLoading(true);
      await removeUserFromEdition(inscripcionId);
      await loadData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading && users.length === 0) return <div>Cargando usuarios...</div>;

  return (
    <div className="asignaciones-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Módulo de Asignaciones</h2>
        <p style={{ color: 'var(--text-muted)' }}>Asocia usuarios recién registrados a sus ediciones y roles.</p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      
      {!loading && users.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>No se encontraron usuarios registrados.</p>
          <small style={{ color: 'var(--text-muted)' }}>Esto puede deberse a políticas de seguridad (RLS) en Supabase o a que realmente no hay usuarios.</small>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {users
          .filter(u => {
            // No mostrar admin/owner de sistema (hardcoded o por rol global)
            const isSystemAdmin = u.email === 'plclavero@gmail.com' || u.email === 'vidaccion@live.com.ar';
            // No mostrar si ya tiene inscripciones (según pedido: "Los que ya fueron asignados, ya no deben aparecer")
            const isAssigned = u.Inscripciones && u.Inscripciones.length > 0;
            return !isSystemAdmin && !isAssigned;
          })
          .map((u) => (
          <div key={u.uid} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20} color="var(--primary-color)" />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>
                    {u.nombre && u.nombre !== 'Usuario' && u.nombre !== 'Usuario Nuevo' ? `${u.nombre} ${u.apellido}` : u.email.split('@')[0]}
                  </h4>
                  <small style={{ color: 'var(--text-muted)' }}>{u.email}</small>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Inscripciones actuales:</p>
                {u.Inscripciones && u.Inscripciones.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {u.Inscripciones.map((ins) => (
                      <li key={ins.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                        <div>
                          <strong>{ins.Ediciones?.nombre_grupo || 'Edición Desconocida'}</strong>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '0.1rem 0.4rem', borderRadius: '0.5rem' }}>
                            {ins.rol}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleUnassign(ins.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                          title="Quitar de edición"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#f59e0b', fontSize: '0.85rem' }}>⚠ Sin ediciones asignadas</p>
                )}
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={() => setSelectedUser(u)}
            >
              <UserPlus size={18} />
              Asignar a Edición
            </button>
          </div>
        ))}
      </div>

      {/* Modal / Form Overlay */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', border: '1px solid var(--primary-color)' }}>
            <h3>Asignar a {selectedUser.nombre}</h3>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Seleccionar Edición</label>
                <select 
                  value={assignmentData.id_edicion} 
                  onChange={(e) => setAssignmentData({ ...assignmentData, id_edicion: e.target.value })}
                  required
                >
                  <option value="">-- Elige una edición --</option>
                  {ediciones.map(ed => (
                    <option key={ed.id} value={ed.id}>{ed.nombre_grupo}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select 
                  value={assignmentData.rol} 
                  onChange={(e) => setAssignmentData({ ...assignmentData, rol: e.target.value })}
                  required
                >
                  <option value="Participante">Participante</option>
                  <option value="Senior">Senior</option>
                  <option value="Papisado">Papisado</option>
                  <option value="Coach">Coach</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
