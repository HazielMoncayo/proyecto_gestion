import { useState, useEffect } from 'react';
import { supabase } from '../supaBase/supabaseClient';
import { IMPLEMENTOS_POR_CATEGORIA } from '../data/canchasData';
import './permisiones.css';

export default function Permisos({ cancha, fecha, fechaFormateada, slot, onClose, onReservaCreada }) {
  const [carnet, setCarnet] = useState(null);
  const [cedulaFrente, setCedulaFrente] = useState(null);
  const [cedulaAtras, setCedulaAtras] = useState(null);
  
  // Estados para controlar los implementos de forma específica
  const [quiereBalon, setQuiereBalon] = useState(false);
  const [quiereRed, setQuiereRed] = useState(false); // Exclusivo para Vóley
  
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Detectamos la categoría de la cancha para facilitar las condiciones
  const categoriaNormalizada = cancha?.categoria?.toLowerCase() || '';
  const esVoley = categoriaNormalizada.includes('voley') || categoriaNormalizada.includes('voleibol');

  // Determina si se solicita CUALQUIER implemento
  const deseaCosas = esVoley ? (quiereBalon || quiereRed) : quiereBalon;

  // Limpiar errores si el usuario desmarca los implementos
  useEffect(() => {
    if (!deseaCosas) {
      setError('');
    }
  }, [deseaCosas]);

  const handleImagenChange = (e, setImagen) => {
    const file = e.target.files[0];
    if (file) {
      setImagen({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const subirImagen = async (userId, imagen, nombre) => {
    const ruta = `${userId}/${Date.now()}_${nombre}_${imagen.file.name}`;
    const { error } = await supabase.storage
      .from('comprobantes')
      .upload(ruta, imagen.file);

    if (error) throw error;
    return ruta;
  };

  const descontarImplementos = async (categoria) => {
    const items = IMPLEMENTOS_POR_CATEGORIA[categoria] || [];
    for (const item of items) {
      const { error } = await supabase.rpc('decrementar_stock', {
        p_item_key: item.item_key,
        p_cantidad: item.cantidad
      });
      if (error) console.error(`Error al descontar ${item.item_key}:`, error);
    }
  };

  const handleAceptar = async () => {
    if (!carnet) {
      setError('Debes subir el carnet estudiantil obligatoriamente.');
      return;
    }

    if (deseaCosas && (!cedulaFrente || !cedulaAtras)) {
      setError('Si solicitas implementos, debes subir ambos lados de la cédula.');
      return;
    }

    setError('');
    setEnviando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Tu sesión expiró, vuelve a iniciar sesión.');
        setEnviando(false);
        return;
      }

      const carnetPath = await subirImagen(user.id, carnet, 'carnet');
      
      let cedulaFrentePath = null;
      let cedulaAtrasPath = null;

      if (deseaCosas) {
        cedulaFrentePath = await subirImagen(user.id, cedulaFrente, 'cedula_frente');
        cedulaAtrasPath = await subirImagen(user.id, cedulaAtras, 'cedula_atras');
      }

      // Preparamos qué implementos se guardarán en la base de datos si lo requieres
      const { error: insertError } = await supabase.from('reservas').insert({
        cancha_id: cancha.id,
        categoria: cancha.categoria,
        fecha: fecha,
        hora_inicio: slot.horaInicio,
        hora_fin: slot.horaFin,
        usuario_id: user.id,
        estudiante_nombre: user.user_metadata?.nombre || '',
        estudiante_email: user.email,
        estado: 'pendiente',
        desea_implementos: deseaCosas,
        carnet_url: carnetPath,
        cedula_frente_url: cedulaFrentePath, 
        cedula_atras_url: cedulaAtrasPath    
      });

      if (insertError) throw insertError;

      if (deseaCosas) {
        await descontarImplementos(cancha.categoria);
      }

      alert('Tu solicitud fue enviada correctamente.');
      onReservaCreada ? onReservaCreada() : onClose();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const UploadBox = ({ label, imagen, onChange }) => (
    <label className="perm-upload-box">
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="perm-upload-input"
      />
      {imagen ? (
        <img src={imagen.preview} alt={label} className="perm-upload-preview" />
      ) : (
        <div className="perm-upload-placeholder">
          <span className="perm-upload-icono">📷</span>
          <span className="perm-upload-texto">{label}</span>
        </div>
      )}
    </label>
  );

  return (
    <div className="perm-overlay" onClick={onClose}>
      <div className="perm-modal" onClick={(e) => e.stopPropagation()}>

        <div className="perm-header">
          <h2 className="perm-titulo">Solicitud de Reserva</h2>
          <button className="perm-cerrar" onClick={onClose}>✕</button>
        </div>

        {(cancha || slot) && (
          <p className="perm-subtitulo" style={{ marginBottom: '20px' }}>
            {cancha?.nombre} {slot?.hora && `· ${slot.hora}`} {fechaFormateada && `· ${fechaFormateada}`}
          </p>
        )}

        {/* CONTROLES DINÁMICOS DE IMPLEMENTOS */}
        <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {esVoley ? (
            // Caso Vóley: Dos opciones separadas
            <>
              <p className="perm-label" style={{ margin: 0, fontSize: '0.85rem' }}>¿Necesita implementos de Vóley?</p>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label className="perm-checkbox-row" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={quiereBalon}
                    onChange={(e) => setQuiereBalon(e.target.checked)}
                    className="perm-checkbox"
                  />
                  <span>Pedir Balón</span>
                </label>
                <label className="perm-checkbox-row" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={quiereRed}
                    onChange={(e) => setQuiereRed(e.target.checked)}
                    className="perm-checkbox"
                  />
                  <span>Pedir Red</span>
                </label>
              </div>
            </>
          ) : (
            // Caso Fútbol / Básquet / Otros: Un solo check claro
            <label className="perm-checkbox-row" style={{ margin: 0 }}>
              <input
                type="checkbox"
                checked={quiereBalon}
                onChange={(e) => setQuiereBalon(e.target.checked)}
                className="perm-checkbox"
              />
              <span>¿Necesita que le proporcionemos un balón para su reserva?</span>
            </label>
          )}
        </div>

        {/* CONTENEDOR DE IMÁGENES (Con marginBottom para evitar que se pegue al botón) */}
        <div className="perm-imagenes" style={{ marginBottom: '30px' }}>
          <div className="perm-col-izquierda">
            <p className="perm-label">Carnet Estudiantil</p>
            <UploadBox
              label="Subir carnet"
              imagen={carnet}
              onChange={(e) => handleImagenChange(e, setCarnet)}
            />
          </div>

          {deseaCosas && (
            <div className="perm-col-derecha">
              <p className="perm-label">Cédula de Identidad</p>
              <div className="perm-cedula-grid">
                <UploadBox
                  label="Parte frontal"
                  imagen={cedulaFrente}
                  onChange={(e) => handleImagenChange(e, setCedulaFrente)}
                />
                <UploadBox
                  label="Parte atrás"
                  imagen={cedulaAtras}
                  onChange={(e) => handleImagenChange(e, setCedulaAtras)}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="perm-error" style={{ marginBottom: '15px' }}>{error}</p>}

        <button className="perm-btn-aceptar" onClick={handleAceptar} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}