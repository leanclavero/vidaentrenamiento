import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEdiciones } from '../services/edicionesService';
import { getInscripciones, updateInscripcion } from '../services/inscripcionesService';
import { Copy, UserPlus, CheckCircle } from 'lucide-react';

export default function Team() {
  const { profile } = useAuth();
  const [ediciones, setEdiciones] = useState([]);
  const [selectedEdicion, setSelectedEdicion] = useState('');
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState('');
  const [assigningId, setAssigningId] = useState(null); // ID of inscrip being assigned a superior

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

  const handleSuperiorChange = async (inscripcionId, superiorUid) => {
    try {
      await updateInscripcion(inscripcionId, { id_superior: superiorUid });
      const sup = inscripciones.find(i => i.usuario.uid === superiorUid)?.usuario;
      setInscripciones(prev => prev.map(ins => 
        ins.id === inscripcionId 
          ? { ...ins, id_superior: superiorUid, superior: sup ? { nombre: sup.nombre, apellido: sup.apellido } : null } 
          : ins
      ));
      setAssigningId(null);
    } catch (err) {
      alert("Error al asignar superior");
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(''), 2000);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {['Participante', 'Senior'].map(role => (
            <div key={role} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-color)' }}>
              <span style={{ fontWeight: '600' }}>{role}</span>
              <button 
                className="btn btn-secondary" 
                style={{ width: 'auto', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => copyToClipboard(getInvitationLink(role), role)}
              >
                {copyStatus === role ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
                {copyStatus === role ? 'Copiado' : 'Copiar Link'}
              </button>
            </div>
          ))}
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
                  <td style={{ padding: '0.75rem' }}>
                    {ins.usuario?.nombre && ins.usuario?.nombre !== 'Usuario' 
                      ? `${ins.usuario.nombre} ${ins.usuario.apellido}` 
                      : ins.usuario?.email?.split('@')[0]}
                  </td>
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
                    {ins.rol === 'Participante' ? (
                      assigningId === ins.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select 
                            style={{ background: 'var(--card-bg)', color: 'var(--text-main)', padding: '0.2rem', borderRadius: '0.25rem' }}
                            onChange={(e) => handleSuperiorChange(ins.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>Seleccionar...</option>
                            <option value="null">Ninguno</option>
                            {inscripciones
                              .filter(i => i.usuario?.uid !== ins.usuario?.uid && i.rol === 'Senior')
                              .map(i => (
                                <option key={i.usuario.uid} value={i.usuario.uid}>
                                  {i.usuario.nombre && i.usuario.nombre !== 'Usuario' ? `${i.usuario.nombre} ${i.usuario.apellido}` : i.usuario.email.split('@')[0]}
                                </option>
                              ))
                            }
                          </select>
                          <button onClick={() => setAssigningId(null)} className="btn" style={{ padding: '0.1rem 0.4rem', width: 'auto' }}>x</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: ins.superior ? 'var(--text-main)' : 'var(--text-muted)' }}>
                            {ins.superior ? `${ins.superior.nombre} ${ins.superior.apellido}` : 'Sin asignar'}
                          </span>
                          <button 
                            onClick={() => setAssigningId(ins.id)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', width: 'auto' }}
                          >
                            {ins.superior ? 'Cambiar' : 'Asignar'}
                          </button>
                        </div>
                      )
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem italic' }}>Estructural</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button 
                      onClick={() => alert("Función de reporte próximamente")}
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Ver Reporte
                    </button>
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
