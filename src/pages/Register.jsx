import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Register() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: registerError } = await registerWithEmail(email, password, { 
      nombre, 
      apellido 
    });

    if (registerError) {
      setError(registerError.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      // Create user profile in 'Usuarios' table
      const { error: dbError } = await supabase.from('Usuarios').insert([{
        uid: data.user.id,
        nombre,
        apellido,
        email,
      }]);
      
      if (dbError) {
        console.error("Error creating user profile", dbError);
      }
      
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error: err } = await loginWithGoogle();
    if (err) setError(err.message);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Crear Cuenta</h2>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label>Nombre</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej. Juan" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Apellido</label>
              <input type="text" value={apellido} onChange={e => setApellido(e.target.value)} required placeholder="Ej. Pérez" />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ejemplo@correo.com" />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
        <div className="divider">o</div>
        <button onClick={handleGoogle} className="btn btn-google" type="button">
          Continuar con Google
        </button>
        <div className="register-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link>
        </div>
      </div>
    </div>
  );
}
