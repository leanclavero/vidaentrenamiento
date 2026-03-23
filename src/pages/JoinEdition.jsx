import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { joinEdicionAsRole } from '../services/inscripcionesService';

export default function JoinEdition() {
  const { id_edicion } = useParams();
  const [searchParams] = useSearchParams();
  const rolParam = searchParams.get('rol') || 'Participante';
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Procesando invitación...');

  useEffect(() => {
    if (loading) return;
    
    // Guardar la intención de unirse por si se pierde al navegar
    localStorage.setItem('pending_join', JSON.stringify({ id_edicion, rol: rolParam }));

    if (!user) {
      setStatus('Debes iniciar sesión o registrarte para unirte a esta edición.');
      return;
    }

    const processJoin = async () => {
      try {
        await joinEdicionAsRole(user.id, id_edicion, rolParam);
        localStorage.removeItem('pending_join');
        setStatus(`Te has unido a la edición con éxito como ${rolParam}. Redirigiendo al inicio...`);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err) {
        setStatus(`Error al unirte: ${err.message}`);
      }
    };
    
    processJoin();
  }, [user, loading, id_edicion, rolParam, navigate]);

  return (
    <div className="login-container">
      <div className="login-box" style={{ textAlign: 'center' }}>
        <h2>Únete al Entrenamiento</h2>
        <div style={{ marginTop: '2rem', color: 'var(--text-main)', marginBottom: '2rem' }}>
          <p>{status}</p>
        </div>
        
        {!user && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Iniciar Sesión
            </Link>
            <Link to="/register" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Crear Cuenta Nueva
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
