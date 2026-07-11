import { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { supabase } from '../supaBase/supabaseClient';
import { IMPLEMENTOS_POR_CATEGORIA } from '../data/canchasData';
import './permisiones.css';

// Quita tildes y pasa a mayúsculas para comparar texto de forma más tolerante a errores de OCR
const normalizarTexto = (texto) =>
  texto
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const contieneAlguna = (texto, palabras) => {
  const normalizado = normalizarTexto(texto);
  return palabras.some((p) => normalizado.includes(p));
};

// Palabras clave esperadas en cada tipo de documento.
// Basta con encontrar UNA de la lista para considerar la imagen válida
// (el OCR de fotos tomadas con celular nunca es perfecto).
const PALABRAS_CARNET = ['POLITECNICA', 'EPN', 'CARNET', 'ESTUDIANTIL'];
const PALABRAS_CEDULA = ['ECUADOR', 'CEDULA', 'IDENTIDAD', 'REGISTRO CIVIL', 'IDENTIFICACION'];

// Corre OCR sobre una imagen y revisa si el texto detectado contiene alguna palabra clave.
// Si el OCR falla por alguna razón (imagen corrupta, error de red al cargar el modelo, etc.)
// dejamos pasar la imagen para no bloquear al usuario por un problema técnico ajeno a él.
const validarTextoImagen = async (file, palabrasClave) => {
  try {
    const { data } = await Tesseract.recognize(file, 'spa');
    const texto = data?.text || '';
    return contieneAlguna(texto, palabrasClave);
  } catch (err) {
    console.error('Error al analizar la imagen con OCR:', err);
    return true;
  }
};

export default function Permisos({ cancha, fecha, fechaFormateada, slot, onClose, onReservaCreada }) {
  const [carnet, setCarnet] = useState(null);
  const [cedulaFrente, setCedulaFrente] = useState(null);
  const [cedulaAtras, setCedulaAtras] = useState(null);

  // Validación OCR del carnet
  const [validandoCarnet, setValidandoCarnet] = useState(false);
  const [carnetValido, setCarnetValido] = useState(false);
  const [errorCarnet, setErrorCarnet] = useState('');

  // Validación OCR de la cédula (frente)
  const [validandoCedulaFrente, setValidandoCedulaFrente] = useState(false);
  const [cedulaFrenteValida, setCedulaFrenteValida] = useState(false);
  const [errorCedulaFrente, setErrorCedulaFrente] = useState('');

  // Validación OCR de la cédula (atrás)
  const [validandoCedulaAtras, setValidandoCedulaAtras] = useState(false);
  const [cedulaAtrasValida, setCedulaAtrasValida] = useState(false);
  const [errorCedulaAtras, setErrorCedulaAtras] = useState('');

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

  // Sube la foto del carnet y la valida con OCR
  const handleCarnetChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCarnet({ file, preview: URL.createObjectURL(file) });
    setCarnetValido(false);
    setErrorCarnet('');
    setValidandoCarnet(true);

    const valido = await validarTextoImagen(file, PALABRAS_CARNET);

    setCarnetValido(valido);
    if (valido) {
      setErrorCarnet('');
    } else {
      // La imagen no pasó la validación: la quitamos del campo para que
      // el usuario pueda intentar de nuevo, y dejamos solo el mensaje de error.
      setCarnet(null);
      setErrorCarnet('Esta imagen no parece ser un carnet estudiantil de la EPN. Sube una foto clara del carnet.');
    }
    setValidandoCarnet(false);
    e.target.value = ''; // permite volver a seleccionar el mismo archivo si el usuario quiere reintentar
  };

  // Sube la foto del frente de la cédula y la valida con OCR
  const handleCedulaFrenteChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCedulaFrente({ file, preview: URL.createObjectURL(file) });
    setCedulaFrenteValida(false);
    setErrorCedulaFrente('');
    setValidandoCedulaFrente(true);

    const valido = await validarTextoImagen(file, PALABRAS_CEDULA);

    setCedulaFrenteValida(valido);
    if (valido) {
      setErrorCedulaFrente('');
    } else {
      setCedulaFrente(null);
      setErrorCedulaFrente('Esta imagen no parece ser el frente de una cédula ecuatoriana. Sube una foto clara.');
    }
    setValidandoCedulaFrente(false);
    e.target.value = '';
  };

  // Sube la foto del reverso de la cédula y la valida con OCR
  const handleCedulaAtrasChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCedulaAtras({ file, preview: URL.createObjectURL(file) });
    setCedulaAtrasValida(false);
    setErrorCedulaAtras('');
    setValidandoCedulaAtras(true);

    const valido = await validarTextoImagen(file, PALABRAS_CEDULA);

    setCedulaAtrasValida(valido);
    if (valido) {
      setErrorCedulaAtras('');
    } else {
      setCedulaAtras(null);
      setErrorCedulaAtras('Esta imagen no parece ser el reverso de una cédula ecuatoriana. Sube una foto clara.');
    }
    setValidandoCedulaAtras(false);
    e.target.value = '';
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

    if (validandoCarnet || (deseaCosas && (validandoCedulaFrente || validandoCedulaAtras))) {
      setError('Espera a que termine de verificarse la imagen.');
      return;
    }

    if (!carnetValido) {
      setError('El carnet subido no parece válido. Sube una foto clara de tu carnet estudiantil de la EPN.');
      return;
    }

    if (deseaCosas && (!cedulaFrente || !cedulaAtras)) {
      setError('Si solicitas implementos, debes subir ambos lados de la cédula.');
      return;
    }

    if (deseaCosas && (!cedulaFrenteValida || !cedulaAtrasValida)) {
      setError('Una o ambas imágenes de la cédula no parecen válidas. Sube fotos claras de ambos lados.');
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

  const UploadBox = ({ label, imagen, onChange, validando, valido, errorMsg }) => (
    <div className="perm-upload-wrapper">
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

        {validando && (
          <div className="perm-upload-validando">
            <span className="perm-upload-spinner" />
            <span>Verificando imagen...</span>
          </div>
        )}

        {!validando && imagen && valido && (
          <span className="perm-upload-badge perm-upload-badge-ok">✓ Válida</span>
        )}
      </label>
      {!validando && errorMsg && (
        <p className="perm-upload-error">{errorMsg}</p>
      )}
    </div>
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

        {/* CONTENEDOR DE IMÁGENES */}
        <div className="perm-imagenes" style={{ marginBottom: '30px' }}>
          <div className="perm-col-izquierda">
            <p className="perm-label">Carnet Estudiantil</p>
            <UploadBox
              label="Subir carnet"
              imagen={carnet}
              onChange={handleCarnetChange}
              validando={validandoCarnet}
              valido={carnetValido}
              errorMsg={errorCarnet}
            />
          </div>

          {deseaCosas && (
            <div className="perm-col-derecha">
              <p className="perm-label">Cédula de Identidad</p>
              <div className="perm-cedula-grid">
                <UploadBox
                  label="Parte frontal"
                  imagen={cedulaFrente}
                  onChange={handleCedulaFrenteChange}
                  validando={validandoCedulaFrente}
                  valido={cedulaFrenteValida}
                  errorMsg={errorCedulaFrente}
                />
                <UploadBox
                  label="Parte atrás"
                  imagen={cedulaAtras}
                  onChange={handleCedulaAtrasChange}
                  validando={validandoCedulaAtras}
                  valido={cedulaAtrasValida}
                  errorMsg={errorCedulaAtras}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="perm-error" style={{ marginBottom: '15px' }}>{error}</p>}

        <button
          className="perm-btn-aceptar"
          onClick={handleAceptar}
          disabled={enviando || validandoCarnet || validandoCedulaFrente || validandoCedulaAtras}
        >
          {enviando ? 'Enviando...' : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}