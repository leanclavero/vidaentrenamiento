// v1.1 - Added Thumbnails, Goal Titles, and Axis
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvidenciasPendientes, revisarEvidencia } from '../services/evidenciasService';
import { Check, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

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
        {evidencias.map(evi => {
          const meta = evi.declaracion?.meta;
          const userMeta = meta?.usuario;
          const name = userMeta?.nombre ? `${userMeta.nombre} ${userMeta.apellido}` : userMeta?.email?.split('@')[0];

          return (
            <div key={evi.id_evidencia} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'1rem' }}>
                <h4 style={{margin:0, color:'var(--primary-color)'}}>
                  {name}
                </h4>
                <span style={{fontSize:'0.8rem', padding:'0.2rem 0.6rem', borderRadius:'1rem', background: 'rgba(255,255,255,0.05)'}}>
                  Semana {evi.declaracion?.semana_nro}
                </span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom: '0.25rem'}}>
                  <strong>Meta:</strong> [{meta?.eje}] {meta?.titulo || meta?.descripcion?.substring(0,40) + '...'}
                </p>
                <p style={{fontSize:'0.95rem', fontWeight: '500'}}>
                  <strong>Acción:</strong> {evi.declaracion?.descripcion_compromiso}
                </p>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding:'1rem', borderRadius:'0.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {evi.url_foto_evidencia ? (
                  <div style={{textAlign: 'center'}}>
                    <img 
                      src={evi.url_foto_evidencia} 
                      alt="Evidencia" 
                      style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--border-color)', display: 'block', margin: '0 auto' }} 
                    />
                    <a href={evi.url_foto_evidencia} target="_blank" rel="noreferrer" style={{color:'var(--primary-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', textDecoration: 'none'}}>
                      <ExternalLink size={14} /> Ver tamaño completo
                    </a>
                  </div>
                ) : (
                  <div style={{textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>
                    <ImageIcon size={32} style={{opacity: 0.3, marginBottom: '0.5rem'}} />
                    <div>Sin imagen adjunta</div>
                  </div>
                )}
                
                {evi.comentario_participante && (
                   <div style={{fontSize:'0.9rem', fontStyle:'italic', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', textAlign: 'center'}}>
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
          );
        })}
        
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

