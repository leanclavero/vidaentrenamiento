import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvidenciasPendientes, revisarEvidencia } from '../services/evidenciasService';
import { Check, X } from 'lucide-react';

export default function Aprobaciones() {
  const { user } = useAuth();
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvidencias = async () => {
    setLoading(true);
    try {
      const data = await getEvidenciasPendientes();
      setEvidencias(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEvidencias();
  }, [user]);

  const handleAction = async (id, status) => {
    try {
      setLoading(true);
      await revisarEvidencia(id, user.id, status);
      await fetchEvidencias();
    } catch(err) {
       alert("Error al revisar: " + err.message);
       setLoading(false);
    }
  };

  if (loading && evidencias.length === 0) return <div style={{padding:'2rem'}}>Buscando pendientes...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Revisión de Evidencias (Superiores)</h2>
        <button className="btn btn-secondary" onClick={fetchEvidencias} style={{width:'auto', padding:'0.5rem 1rem'}}>Actualizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {evidencias.map(evi => (
          <div key={evi.id_evidencia} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem' }}>
              <h4 style={{margin:0, color:'var(--primary-color)'}}>
                {evi.declaracion?.meta?.usuario?.nombre} {evi.declaracion?.meta?.usuario?.apellido}
              </h4>
              <span style={{fontSize:'0.8rem', padding:'0.2rem 0.6rem', borderRadius:'1rem', background: 'rgba(255,255,255,0.05)'}}>
                Semana {evi.declaracion?.semana_nro}
              </span>
            </div>
            
            <p style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>
              <strong>Meta:</strong> {evi.declaracion?.meta?.descripcion}
            </p>
            <p style={{fontSize:'0.95rem', margin:'0.5rem 0'}}>
              <strong>Acción:</strong> {evi.declaracion?.descripcion_compromiso}
            </p>
            
            <div style={{ background: 'rgba(0,0,0,0.2)', padding:'1rem', borderRadius:'0.5rem', marginTop:'1rem' }}>
              {evi.url_foto_evidencia ? (
                <div style={{marginBottom:'0.5rem'}}>
                  <a href={evi.url_foto_evidencia} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)', fontWeight:'bold'}}>
                    Ver Foto / Archivo 🔗
                  </a>
                </div>
              ) : (
                <div style={{marginBottom:'0.5rem', fontStyle:'italic', color:'var(--text-muted)'}}>Sin archivo / Sólo texto</div>
              )}
              {evi.comentario_participante && (
                 <div style={{fontSize:'0.9rem', fontStyle:'italic'}}>
                   "{evi.comentario_participante}"
                 </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, display:'flex', justifyContent:'center', gap:'0.5rem', background:'#10b981' }} onClick={()=>handleAction(evi.id_evidencia, 'Aprobado')}>
                <Check size={18} /> Aprobar
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, display:'flex', justifyContent:'center', gap:'0.5rem', color:'var(--error-color)', borderColor:'rgba(239, 68, 68, 0.3)' }} onClick={()=>handleAction(evi.id_evidencia, 'Rechazado')}>
                <X size={18} /> Rechazar
              </button>
            </div>
          </div>
        ))}
        
        {evidencias.length === 0 && (
          <div className="card" style={{gridColumn:'1 / -1', textAlign:'center', padding:'3rem 1rem'}}>
             <h3 style={{color:'var(--text-muted)'}}>Todo al día 🎉</h3>
             <p>No hay evidencias pendientes de revisión de tu equipo asignado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
