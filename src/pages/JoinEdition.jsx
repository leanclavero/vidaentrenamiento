import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
    
    if (!user) {
      // Si no logueado, vamos al login pero podríamos usar context para redirigir tras loguear.
      // Aquí simplificamos desviando al login para que el usuario se cree la cuenta, 
      // luego deberá volver al link. En una v2 se guarda el intento en localStorage.
      sessionStorage.setItem('redirect_after_login', `/join/${id_edicion}?rol=${rolParam}`);
      navigate('/login', { replace: true });
      return;
    }

    const processJoin = async () => {
      try {
        await joinEdicionAsRole(user.id, id_edicion, rolParam);
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
        <div style={{ marginTop: '2rem', color: 'var(--text-main)' }}>
          <p>{status}</p>
        </div>
      </div>
    </div>
  );
}
