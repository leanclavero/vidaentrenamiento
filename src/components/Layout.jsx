import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { LogOut, Home, Users, Target, Calendar, CheckSquare, ShieldCheck } from 'lucide-react';

export default function Layout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Determine user role (this will eventually come from Inscripciones per edition)
  const role = profile?.rol_global || 'Participante';

  return (
    <div className="layout-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Coaching App</h2>
          <p className="user-role">{role}</p>
        </div>
        <ul className="sidebar-nav">
          <li>
            <Link to="/">
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          {(role === 'Owner' || role === 'Admin' || role === 'Coach' || role === 'Coordinador') && (
            <li>
              <Link to="/editions">
                <Calendar size={20} />
                <span>Ediciones</span>
              </Link>
          </li>
          )}
          {(role !== 'Participante') && (
            <li>
              <Link to="/team">
                <Users size={20} />
                <span>Mi Equipo</span>
              </Link>
            </li>
          )}
          <li>
            <Link to="/goals">
              <Target size={20} />
              <span>Mis Metas</span>
            </Link>
          </li>
          <li>
            <Link to="/actions">
              <CheckSquare size={20} />
              <span>Mis Acciones</span>
            </Link>
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
