import { useState } from 'react';
import { supabase } from '../supaBase/supabaseClient';
import { IMPLEMENTOS_POR_CATEGORIA } from '../data/canchasData';
import './permisiones.css';

export default function Permisos({ cancha, fecha, fechaFormateada, slot, onClose, onReservaCreada }) {
  const [carnet, setCarnet] = useState(null);
  const [cedulaFrente, setCedulaFrente] = useState(null);
  const [cedulaAtras, setCedulaAtras] = useState(null);
  const [deseaCosas, setDeseaCosas] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

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
    if (!carnet || !cedulaFrente || !cedulaAtras) {
      setError('Debes subir el carnet y ambos lados de la cédula.');
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
      const cedulaFrentePath = await subirImagen(user.id, cedulaFrente, 'cedula_frente');
      const cedulaAtrasPath = await subirImagen(user.id, cedulaAtras, 'cedula_atras');

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
          <p className="perm-subtitulo">
            {cancha?.nombre} {slot?.hora && `· ${slot.hora}`} {fechaFormateada && `· ${fechaFormateada}`}
          </p>
        )}

        <div className="perm-imagenes">
          <div className="perm-col-izquierda">
            <p className="perm-label">Carnet Estudiantil</p>
            <UploadBox
              label="Subir carnet"
              imagen={carnet}
              onChange={(e) => handleImagenChange(e, setCarnet)}
            />
          </div>

          <div className="perm-col-derecha">
            <p className="perm-label">Cédula</p>
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
        </div>

        <label className="perm-checkbox-row">
          <input
            type="checkbox"
            checked={deseaCosas}
            onChange={(e) => setDeseaCosas(e.target.checked)}
            className="perm-checkbox"
          />
          <span>¿Deseas que te prestemos los implementos?</span>
        </label>

        {error && <p className="perm-error">{error}</p>}

        <button className="perm-btn-aceptar" onClick={handleAceptar} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}