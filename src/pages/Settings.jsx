import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, User, Mail, Phone, MapPin } from 'lucide-react';

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    apellido: profile?.apellido || '',
    celular: profile?.celular || '',
    direccion: profile?.direccion || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await updateProfile(formData);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem' }}>Ajustes de Perfil</h2>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label><User size={14} style={{ marginRight: '0.5rem' }} /> Nombre</label>
              <input 
                type="text" 
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                required
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input 
                type="text" 
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label><Mail size={14} style={{ marginRight: '0.5rem' }} /> Email (No editable)</label>
            <input 
              type="email" 
              value={profile?.email || ''} 
              disabled 
              style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label><Phone size={14} style={{ marginRight: '0.5rem' }} /> Celular</label>
            <input 
              type="text" 
              name="celular"
              value={formData.celular}
              onChange={handleChange}
              placeholder="Ej: +54 9 11 ..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label><MapPin size={14} style={{ marginRight: '0.5rem' }} /> Dirección</label>
            <input 
              type="text" 
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle, Ciudad, Provincia..."
            />
          </div>

          {message.text && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? '#10b981' : '#f87171',
              border: `1px solid ${message.type === 'success' ? '#10b981' : '#f87171'}`,
              textAlign: 'center'
            }}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Save size={18} />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
