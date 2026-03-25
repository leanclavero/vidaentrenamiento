import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvidenciasPendientes } from '../services/evidenciasService';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const role = profile?.rol_global || 'Participante';

  useEffect(() => {
    if (!user || role === 'Participante') return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await getEvidenciasPendientes();
        setPendingCount(data?.length || 0);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, role]);

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
              pendingCount > 0 
                ? `Tienes ${pendingCount} evidencias pendientes de tu equipo asignado.`
                : 'No tienes evidencias pendientes por revisar. ¡Gran trabajo!'
            )}
          </p>
        </div>
      )}
      
      {(role === 'Coach' || role === 'Coordinador' || role === 'Admin' || role === 'Owner') && (
        <div className="card">
          <h4>Estadísticas de la Edición</h4>
          <p>Hay {pendingCount} evidencias pendientes de validación en total.</p>
        </div>
      )}
    </div>
  );
}
