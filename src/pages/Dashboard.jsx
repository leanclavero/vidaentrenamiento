// v1.1 - Added Goals Approval Stats for Staff
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvidenciasPendientes } from '../services/evidenciasService';
import { getMetasPendientes } from '../services/metasService';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [eviCount, setEviCount] = useState(0);
  const [metasCount, setMetasCount] = useState(0);
  const [metasUsersCount, setMetasUsersCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const role = profile?.rol_global || 'Participante';
  const isStaff = ['Owner', 'Admin', 'Coach', 'Coordinador'].includes(role);

  useEffect(() => {
    if (!user || role === 'Participante') return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // Evidencias
        const eviData = await getEvidenciasPendientes();
        setEviCount(eviData?.length || 0);

        // Metas (only for higher staff)
        if (isStaff) {
          const metasData = await getMetasPendientes();
          setMetasCount(metasData?.length || 0);
          const uniqueUsers = new Set(metasData?.map(m => m.id_usuario));
          setMetasUsersCount(uniqueUsers.size);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, role, isStaff]);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Resumen Semanal</h2>
      
      <div className="card">
        <h4>¡Hola, {profile?.nombre || user?.email}!</h4>
        <p>Tu rol de acceso global actual es: <strong>{role}</strong></p>
      </div>
      
      {role === 'Participante' && (
        <div className="card">
          <h4>Mis Acciones Pendientes</h4>
          <p>Aún no tienes acciones declaradas para esta semana.</p>
        </div>
      )}
      
      {(role === 'Senior' || role === 'Papisado') && (
        <div className="card">
          <h4>Evidencias por Aprobar</h4>
          <p>
            {loading ? 'Cargando estadísticas...' : (
              eviCount > 0 
                ? `Tienes ${eviCount} evidencias pendientes de tu equipo asignado.`
                : 'No tienes evidencias pendientes por revisar. ¡Gran trabajo!'
            )}
          </p>
        </div>
      )}
      
      {isStaff && (
        <div className="card">
          <h4>Estadísticas de la Edición</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{eviCount}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Evidencias pendientes</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{metasCount}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Metas de {metasUsersCount} participantes por aprobar</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
