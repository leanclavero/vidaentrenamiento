import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMisParticipantes } from '../services/inscripcionesService';
import { User, Mail, Phone, MapPin, ExternalLink, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyParticipants() {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchParticipants = async () => {
      try {
        const data = await getMisParticipantes(user.id);
        setParticipants(data || []);
      } catch (err) {
        console.error("Error fetching participants:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [user]);

  if (loading) return <div style={{ padding: '2rem' }}>Cargando participantes...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Mis Participantes</h2>
      
      {participants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Aún no tienes participantes asignados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {participants.map(ins => {
            const p = ins.usuario;
            const name = p.nombre && p.nombre !== 'Usuario' ? `${p.nombre} ${p.apellido}` : p.email.split('@')[0];
            const initials = name.substring(0, 2).toUpperCase();
            
            return (
              <div key={ins.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="avatar" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>{initials}</div>
                  <div>
                    <h3 style={{ margin: 0 }}>{name}</h3>
                    <span className="badge badge-participante" style={{ marginTop: '0.25rem' }}>Participante</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <Mail size={16} /> {p.email}
                  </div>
                  {p.celular && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <Phone size={16} /> {p.celular}
                    </div>
                  )}
                  {p.direccion && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <MapPin size={16} /> {p.direccion}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link to={`/goals?u=${p.uid}`} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <Target size={16} /> Ver Metas
                  </Link>
                  <Link to={`/actions?u=${p.uid}`} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <ExternalLink size={16} /> Acciones
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
