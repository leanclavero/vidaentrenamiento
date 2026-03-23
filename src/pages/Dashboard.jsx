import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, profile } = useAuth();
  
  // Temporalmente determinamos el rol general desde el profile o asignamos Participante
  const role = profile?.rol_global || 'Participante';

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
          <p>Aún no tienes acciones declaradas para esta semana. (Próximamente)</p>
        </div>
      )}
      
      {(role === 'Senior' || role === 'Papisado') && (
        <div className="card">
          <h4>Evidencias por Aprobar</h4>
          <p>Tienes 0 evidencias pendientes de tu equipo asignado. (Próximamente)</p>
        </div>
      )}
      
      {(role === 'Coach' || role === 'Coordinador' || role === 'Admin' || role === 'Owner') && (
        <div className="card">
          <h4>Estadísticas de la Edición</h4>
          <p>Participantes activos pendientes de cargar acciones: 0 (Próximamente)</p>
        </div>
      )}
    </div>
  );
}
