import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEdiciones } from '../services/edicionesService';
import { getInscripciones, updateInscripcion } from '../services/inscripcionesService';

export default function Team() {
  const { profile } = useAuth();
  const [ediciones, setEdiciones] = useState([]);
  const [selectedEdicion, setSelectedEdicion] = useState('');
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load editions for the selector
  useEffect(() => {
    const fetchEdiciones = async () => {
      try {
        const data = await getEdiciones();
        setEdiciones(data);
        if (data.length > 0) {
          setSelectedEdicion(data[0].id);
        }
      } catch (err) {
        console.error("Error cargando ediciones", err);
      }
    };
    fetchEdiciones();
  }, []);

  // Load participants when edition changes
  useEffect(() => {
    if (!selectedEdicion) return;
    const fetchInscripciones = async () => {
      setLoading(true);
      try {
        const data = await getInscripciones(selectedEdicion);
        setInscripciones(data || []);
      } catch (err) {
        console.error("Error cargando inscripciones", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInscripciones();
  }, [selectedEdicion]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await updateInscripcion(id, { rol: newRole });
      setInscripciones(prev => prev.map(ins => ins.id === id ? { ...ins, rol: newRole } : ins));
    } catch (err) {
      alert("Error al cambiar rol");
    }
  };

  const getInvitationLink = (rol) => {
    return `${window.location.origin}/join/${selectedEdicion}?rol=${rol}`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Mi Equipo / Participantes</h2>
        {ediciones.length > 0 && (
          <select 
            value={selectedEdicion} 
            onChange={e => setSelectedEdicion(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--card-bg)', color: 'var(--text-main)' }}
          >
            {ediciones.map(ed => (
              <option key={ed.id} value={ed.id}>{ed.nombre_grupo}</option>
            ))}
          </select>
        )}
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h4>Links de Invitación</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Comparte estos links para invitar a nuevos integrantes a esta Edición.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><strong>Participante:</strong> <code style={{ userSelect: 'all', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: '0.2rem' }}>{getInvitationLink('Participante')}</code></div>
          <div><strong>Senior:</strong> <code style={{ userSelect: 'all', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: '0.2rem' }}>{getInvitationLink('Senior')}</code></div>
          <div><strong>Papisado:</strong> <code style={{ userSelect: 'all', background: 'rgba(0,0,0,0.3)', padding: '0.2rem', borderRadius: '0.2rem' }}>{getInvitationLink('Papisado')}</code></div>
        </div>
      </div>

      <div className="card">
        <h4>Lista de Integrantes</h4>
        {loading ? (
          <p>Cargando integrantes...</p>
        ) : inscripciones.length === 0 ? (
          <p>No hay integrantes en esta edición aún.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Nombre</th>
                <th style={{ padding: '0.75rem' }}>Email</th>
                <th style={{ padding: '0.75rem' }}>Rol</th>
                <th style={{ padding: '0.75rem' }}>Superior (Asignado)</th>
                <th style={{ padding: '0.75rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map(ins => (
                <tr key={ins.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem' }}>{ins.usuario?.nombre} {ins.usuario?.apellido}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{ins.usuario?.email}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <select 
                      value={ins.rol} 
                      onChange={(e) => handleRoleChange(ins.id, e.target.value)}
                      style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '0.25rem', padding: '0.2rem' }}
                    >
                      <option value="Participante">Participante</option>
                      <option value="Senior">Senior</option>
                      <option value="Papisado">Papisado</option>
                      <option value="Coordinador">Coordinador</option>
                      <option value="Coach">Coach</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {ins.superior ? `${ins.superior.nombre} ${ins.superior.apellido}` : 'Sin asignar'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>Asignar Superior</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
