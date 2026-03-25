// v1.1 - Added Notification Badges for Seniors
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Target, Calendar, CheckSquare, ShieldCheck, UserPlus, Settings, UserCheck } from 'lucide-react';
import { getEvidenciasPendientes } from '../services/evidenciasService';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = profile?.rol_global || 'Participante';

  useEffect(() => {
    if (!user || role === 'Participante') return;

    const fetchPending = async () => {
      try {
        const data = await getEvidenciasPendientes();
        setPendingCount(data?.length || 0);
      } catch (err) {
        console.error("Sidebar count error:", err);
      }
    };

    fetchPending();
  }, [user, role, location.pathname]);

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Coaching App</h2>
          <p className="user-role">{role}</p>
        </div>
        <ul className="sidebar-nav">
          <li>
            <NavLink to="/">
              <Home size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          {(role === 'Owner' || role === 'Admin') && (
            <li>
              <NavLink to="/assignments">
                <UserPlus size={20} />
                <span>Asignaciones</span>
              </NavLink>
            </li>
          )}

          {(role === 'Owner' || role === 'Admin' || role === 'Coach' || role === 'Coordinador') && (
            <li>
              <NavLink to="/editions">
                <Calendar size={20} />
                <span>Ediciones</span>
              </NavLink>
            </li>
          )}

          {(role !== 'Participante') && (
            <li>
              <NavLink to="/approvals">
                <ShieldCheck size={20} />
                <span>Validar Evidencias</span>
                {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
              </NavLink>
            </li>
          )}

          {(role === 'Owner' || role === 'Admin' || role === 'Coach' || role === 'Coordinador') && (
            <li>
              <NavLink to="/team">
                <Users size={20} />
                <span>Mi Equipo</span>
              </NavLink>
            </li>
          )}

          {(role === 'Senior' || role === 'Papisado') && (
            <li>
              <NavLink to="/my-participants">
                <Users size={20} />
                <span>Mi Equipo</span>
              </NavLink>
            </li>
          )}

          <li>
            <NavLink to="/goals">
              <Target size={20} />
              <span>{role === 'Senior' || role === 'Papisado' ? 'Metas de Participantes' : 'Mis Metas'}</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/actions">
              <CheckSquare size={20} />
              <span>{role === 'Senior' || role === 'Papisado' ? 'Acciones de Participantes' : 'Mis Acciones'}</span>
            </NavLink>
          </li>

          <li style={{ marginTop: 'auto' }}>
            <NavLink to="/settings">
              <Settings size={20} />
              <span>Ajustes</span>
            </NavLink>
          </li>
        </ul>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        <header className="topbar">
          <h3>Entrenamiento Vivencial</h3>
          <div className="user-profile">
            <span>{profile?.nombre} {profile?.apellido}</span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

