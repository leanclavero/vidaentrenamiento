// v1.3.1 - Sidebar Reordered, Renamed & Triple Badges
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Target, Calendar, CheckSquare, ShieldCheck, UserPlus, Settings } from 'lucide-react';
import { getEvidenciasPendientes } from '../services/evidenciasService';
import { getMetasPendientes } from '../services/metasService';
import { getDeclaracionesPendientes } from '../services/declaracionesService';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingEvi, setPendingEvi] = useState(0);
  const [pendingMetas, setPendingMetas] = useState(0);
  const [pendingDec, setPendingDec] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = profile?.rol_global || 'Participante';
  const isStaff = ['Owner', 'Admin', 'Coach', 'Coordinador'].includes(role);
  const isSenior = ['Senior', 'Papisado'].includes(role);

  useEffect(() => {
    if (!user || role === 'Participante') return;

    const fetchAllPending = async () => {
      try {
        const [eviData, metasData, decData] = await Promise.all([
          getEvidenciasPendientes(),
          getMetasPendientes(),
          getDeclaracionesPendientes()
        ]);
        setPendingEvi(eviData?.length || 0);
        setPendingMetas(metasData?.length || 0);
        setPendingDec(decData?.length || 0);
      } catch (err) {
        console.error("Sidebar counts error:", err);
      }
    };

    fetchAllPending();
  }, [user, role, location.pathname]);

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Coaching App</h2>
          <p className="user-role">{role}</p>
        </div>
        <ul className="sidebar-nav">
          
          {/* 1. Dashboard */}
          <li>
            <NavLink to="/">
              <Home size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          {/* 2. Ediciones (Staff only) */}
          {(isStaff) && (
            <li>
              <NavLink to="/editions">
                <Calendar size={20} />
                <span>Ediciones</span>
              </NavLink>
            </li>
          )}

          {/* Special: Asignaciones (Admin/Owner only) */}
          {(role === 'Owner' || role === 'Admin') && (
            <li>
              <NavLink to="/assignments">
                <UserPlus size={20} />
                <span>Asignaciones</span>
              </NavLink>
            </li>
          )}

          {/* 3. Equipo */}
          {(isStaff) && (
            <li>
              <NavLink to="/team">
                <Users size={20} />
                <span>Equipo</span>
              </NavLink>
            </li>
          )}
          {(isSenior && !isStaff) && (
            <li>
              <NavLink to="/my-participants">
                <Users size={20} />
                <span>Equipo</span>
              </NavLink>
            </li>
          )}

          {/* 4. Metas */}
          <li>
            <NavLink to="/goals">
              <Target size={20} />
              <span>
                {isStaff ? 'Metas' : (isSenior ? 'Metas de Participantes' : 'Mis Metas')}
              </span>
              {isStaff && pendingMetas > 0 && <span className="nav-badge">{pendingMetas}</span>}
            </NavLink>
          </li>

          {/* 5. Declaraciones (formerly Acciones) */}
          <li>
            <NavLink to="/actions">
              <CheckSquare size={20} />
              <span>
                {isStaff ? 'Declaraciones' : (isSenior ? 'Declaraciones de Participantes' : 'Mis Declaraciones')}
              </span>
              {isStaff && pendingDec > 0 && <span className="nav-badge">{pendingDec}</span>}
            </NavLink>
          </li>

          {/* 6. Evidencias (formerly Validar Evidencias) */}
          {(role !== 'Participante') && (
            <li>
              <NavLink to="/approvals">
                <ShieldCheck size={20} />
                <span>Evidencias</span>
                {pendingEvi > 0 && <span className="nav-badge">{pendingEvi}</span>}
              </NavLink>
            </li>
          )}

          {/* 7. Ajustes */}
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
