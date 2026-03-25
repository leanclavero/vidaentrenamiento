// v1.3.1 - Priority Admin Alerts for Assignments
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getEvidenciasPendientes } from '../services/evidenciasService';
import { getMetasPendientes } from '../services/metasService';
import { getParticipantsCount, getPendingAssignmentsCount } from '../services/asignacionesService';
import { getDeclaracionesCount, getDeclaracionesPendientes } from '../services/declaracionesService';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    participants: 0,
    metas: 0,
    declaraciones: 0,
    evidencias: 0,
    metasUsers: 0,
    pendingAssign: 0
  });
  const [loading, setLoading] = useState(false);
  
  const role = profile?.rol_global || 'Participante';
  const isStaff = ['Owner', 'Admin', 'Coach', 'Coordinador'].includes(role);
  const isSenior = ['Senior', 'Papisado'].includes(role);
  const isAdminOrOwner = ['Owner', 'Admin'].includes(role);

  useEffect(() => {
    if (!user || role === 'Participante') return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const promises = [
          getParticipantsCount(),
          getMetasPendientes(),
          getDeclaracionesCount(),
          getEvidenciasPendientes(),
          getDeclaracionesPendientes()
        ];
        
        if (isAdminOrOwner) {
          promises.push(getPendingAssignmentsCount());
        }

        const [pCount, mData, dCount, eData, decPend, assignCount] = await Promise.all(promises);

        const uniqueMetasUsers = new Set(mData?.map(m => m.id_usuario)).size;

        setStats({
          participants: pCount || 0,
          metas: mData?.length || 0,
          declaraciones: dCount || 0,
          evidencias: eData?.length || 0,
          metasUsers: uniqueMetasUsers,
          pendingAssign: assignCount || 0
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, role, isAdminOrOwner]);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Resumen Semanal</h2>
      
      <div className="card">
        <h4>¡Hola, {profile?.nombre || user?.email}!</h4>
        <p>Tu rol de acceso global actual es: <strong>{role}</strong></p>
      </div>

      {isAdminOrOwner && stats.pendingAssign > 0 && (
        <Link to="/assignments" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '1rem', animation: 'pulse 2s infinite' }}>
            <div style={{ background: '#f59e0b', padding: '0.75rem', borderRadius: '50%', color: 'white' }}>
              <AlertCircle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#f59e0b', margin: 0 }}>Acción Prioritaria</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-main)' }}>
                Hay <strong>{stats.pendingAssign}</strong> usuarios registrados pendientes de asignación a una edición.
              </p>
            </div>
            <ArrowRight size={20} color="#f59e0b" />
          </div>
        </Link>
      )}
      
      {role === 'Participante' && (
        <div className="card">
          <h4>Mis Acciones Pendientes</h4>
          <p>Aún no tienes acciones declaradas para esta semana.</p>
        </div>
      )}
      
      {(isStaff || isSenior) && (
        <div className="card">
          <h4>Estadísticas de la Edición</h4>
          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Cargando métricas...</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              
              <Link to={isStaff ? "/team" : "/my-participants"} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#10b981' }}>{stats.participants}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Participantes</div>
                </div>
              </Link>

              <Link to="/goals" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fbbf24' }}>{stats.metas}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {isStaff ? `Metas (de ${stats.metasUsers} pers.) por aprobar` : 'Metas totales'}
                  </div>
                </div>
              </Link>

              <Link to="/actions" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#6366f1' }}>{stats.declaraciones}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Declaraciones</div>
                </div>
              </Link>

              <Link to="/approvals" style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.evidencias}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Evidencias pendientes</div>
                </div>
              </Link>

            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
}
