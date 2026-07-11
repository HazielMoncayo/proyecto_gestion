import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  Calendar, Package, Clock, CheckCircle2, XCircle, AlertTriangle,
  LogOut, User, HelpCircle, X, CreditCard, FileText, Download
} from 'lucide-react';
import { supabase } from '../supaBase/supabaseClient';
import { buscarInfoSubcancha, IMPLEMENTOS_POR_CATEGORIA, generarHorasDelDia } from '../data/canchasData';

const tabs = ['Gestión de Reservas', 'Inventario', 'Control de Horarios', 'Reporte del Día', 'Comprobantes'];
const TabIcon = [Calendar, Package, Clock, FileText, Download];

const statStyle = {
  naranja: { numero: 'text-amber-500', icono: 'bg-amber-100' },
  verde:   { numero: 'text-emerald-600', icono: 'bg-emerald-100' },
  rojo:    { numero: 'text-rose-600', icono: 'bg-rose-100' },
  azul:    { numero: 'text-blue-800', icono: 'bg-blue-100' },
};

const badgeColor = {
  verde: 'bg-emerald-100 text-emerald-700',
  amarillo: 'bg-amber-100 text-amber-700',
  rojo: 'bg-rose-100 text-rose-700',
};

const formatearFechaHora = (iso) => {
  if (!iso) return 'No disponible';
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
};

export default function Encargado() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [tabActivo, setTabActivo] = useState(0);
  const [reservas, setReservas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [cargando, setCargando] = useState(false);

  // Modal de detalle de solicitud
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [detalleReserva, setDetalleReserva] = useState(null);
  const [carnetUrl, setCarnetUrl] = useState(null);
  const [cargandoCarnet, setCargandoCarnet] = useState(false);
  // Vista previa del comprobante (antes de descargar el PDF)
  const [previewAbierto, setPreviewAbierto] = useState(false);
  const [previewReserva, setPreviewReserva] = useState(null);
  const [previewCarnetUrl, setPreviewCarnetUrl] = useState(null);
  const [cargandoPreviewCarnet, setCargandoPreviewCarnet] = useState(false);

  // Miniaturas de carnet para el Reporte del Día
  const [thumbs, setThumbs] = useState({});
  const [cargandoThumbs, setCargandoThumbs] = useState(false);

  // Filtro por fecha en Reporte del Día
  const [filtroFechaReporte, setFiltroFechaReporte] = useState('todas');
  // Filtro por hora en Comprobantes
  const [filtroHoraComprobante, setFiltroHoraComprobante] = useState('todas');

  // PDF en generación (para deshabilitar el botón mientras se genera)
  const [generandoPdfId, setGenerandoPdfId] = useState(null);

  useEffect(() => {
    async function obtenerUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNombreUsuario(user.user_metadata?.nombre || '');
      }
    }
    obtenerUsuario();
  }, []);

  const cargarReservas = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .neq('estado', 'cancelada')
      .order('fecha', { ascending: false })
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al cargar reservas:', error);
      setCargando(false);
      return;
    }

    const conNombre = data.map((r) => {
      const info = buscarInfoSubcancha(r.cancha_id);
      return {
        id: r.id,
        estudiante: r.estudiante_nombre || r.estudiante_email || 'Estudiante',
        estudianteEmail: r.estudiante_email || '',
        cancha: info
          ? `${info.canchaPrincipal.nombre} · ${info.subcancha.nombre}`
          : r.cancha_id,
        fecha: r.fecha,
        fechaLabel: new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-ES'),
        hora: `${r.hora_inicio} - ${r.hora_fin}`,
        horaInicio: r.hora_inicio,
        estado: r.estado,
        categoria: r.categoria,
        deseaImplementos: r.desea_implementos,
        carnetUrl: r.carnet_url,
        creadoEn: r.created_at,
        actualizadoEn: r.updated_at
      };
    });

    setReservas(conNombre);
    setCargando(false);
  };

  const cargarInventario = async () => {
    const { data, error } = await supabase
      .from('inventario')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error al cargar inventario:', error);
      return;
    }

    setInventario(data);
  };

  useEffect(() => {
    cargarReservas();
    cargarInventario();
  }, []);

  const pendientes = reservas.filter(r => r.estado === 'pendiente');
  const confirmadas = reservas.filter(r => r.estado === 'confirmada');
  const confirmadasHoy = confirmadas.filter(r => r.fecha === today);
  const bajosStock = inventario.filter(i => i.stock < i.minimo);
  const totalInventario = inventario.reduce((sum, i) => sum + i.stock, 0);

  const handleAprobar = async (id) => {
    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'confirmada' })
      .eq('id', id);

    if (error) {
      console.error('Error al aprobar:', error);
      alert('No se pudo aprobar la reserva.');
      return;
    }

    setDetalleAbierto(false);
    cargarReservas();
  };

  const handleRechazar = async (reserva) => {
    if (!window.confirm('¿Rechazar esta reserva?')) return;

    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', reserva.id);

    if (error) {
      console.error('Error al rechazar:', error);
      alert('No se pudo rechazar la reserva.');
      return;
    }

    if (reserva.deseaImplementos && reserva.categoria) {
      const items = IMPLEMENTOS_POR_CATEGORIA[reserva.categoria] || [];
      for (const item of items) {
        await supabase.rpc('incrementar_stock', {
          p_item_key: item.item_key,
          p_cantidad: item.cantidad
        });
      }
      cargarInventario();
    }

    setDetalleAbierto(false);
    cargarReservas();
  };

  const abrirPreviewComprobante = async (reserva) => {
    setPreviewReserva(reserva);
    setPreviewAbierto(true);
    setPreviewCarnetUrl(null);

    if (reserva.carnetUrl) {
      setCargandoPreviewCarnet(true);
      const { data, error } = await supabase.storage
        .from('comprobantes')
        .createSignedUrl(reserva.carnetUrl, 60 * 5);

      if (!error) setPreviewCarnetUrl(data.signedUrl);
      setCargandoPreviewCarnet(false);
    }
  };

  const abrirDetalle = async (reserva) => {
    setDetalleReserva(reserva);
    setDetalleAbierto(true);
    setCarnetUrl(null);

    if (reserva.carnetUrl) {
      setCargandoCarnet(true);
      const { data, error } = await supabase.storage
        .from('comprobantes')
        .createSignedUrl(reserva.carnetUrl, 60 * 5);

      if (!error) setCarnetUrl(data.signedUrl);
      setCargandoCarnet(false);
    }
  };

  // Carga las miniaturas de carnet de todas las reservas confirmadas
  // (se usa en Reporte del Día). Solo pide las que aún no tiene en caché.
  const cargarThumbs = async (lista) => {
    const pendientesDeCargar = lista.filter(r => r.carnetUrl && !thumbs[r.id]);
    if (pendientesDeCargar.length === 0) return;

    setCargandoThumbs(true);
    const nuevos = {};

    for (const r of pendientesDeCargar) {
      const { data, error } = await supabase.storage
        .from('comprobantes')
        .createSignedUrl(r.carnetUrl, 60 * 15);
      if (!error) nuevos[r.id] = data.signedUrl;
    }

    setThumbs(prev => ({ ...prev, ...nuevos }));
    setCargandoThumbs(false);
  };

  useEffect(() => {
    if ((tabActivo === 3 || tabActivo === 4) && confirmadas.length > 0) {
      cargarThumbs(confirmadas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActivo, reservas]);

  // Descarga una imagen del bucket privado y la convierte a base64 (para meterla en el PDF)
  const obtenerImagenBase64 = async (path) => {
    const { data, error } = await supabase.storage.from('comprobantes').download(path);
    if (error || !data) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(data);
    });
  };

  const generarComprobantePDF = async (reserva) => {
    setGenerandoPdfId(reserva.id);
    try {
      const doc = new jsPDF();

      // Encabezado
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont(undefined, 'bold');
      doc.text('Buho-Gear', 14, 14);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text('Comprobante de Reserva Deportiva - EPN', 14, 21);

      // Cuerpo
      doc.setTextColor(30, 30, 30);
      let y = 42;
      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text('Detalle de la reserva', 14, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y + 2, 196, y + 2);

      y += 12;
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');

      const campo = (etiqueta, valor) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${etiqueta}:`, 14, y);
        doc.setFont(undefined, 'normal');
        doc.text(String(valor), 65, y);
        y += 8;
      };

      campo('Estudiante', reserva.estudiante);
      campo('Correo', reserva.estudianteEmail || '-');
      campo('Cancha', reserva.cancha);
      campo('Fecha de la reserva', reserva.fechaLabel);
      campo('Hora reservada', reserva.hora);
      campo('Hora de solicitud', formatearFechaHora(reserva.creadoEn));
      campo('Hora de aprobación', formatearFechaHora(reserva.actualizadoEn));
      campo('Implementos prestados', reserva.deseaImplementos ? 'Sí' : 'No');
      campo('Estado', 'Confirmada');

      // Carnet
      if (reserva.carnetUrl) {
        y += 4;
        doc.setFont(undefined, 'bold');
        doc.text('Carnet Estudiantil:', 14, y);
        y += 4;

        const base64 = await obtenerImagenBase64(reserva.carnetUrl);
        if (base64) {
          try {
            doc.addImage(base64, 'JPEG', 14, y, 70, 45);
          } catch {
            doc.addImage(base64, 'PNG', 14, y, 70, 45);
          }
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `Generado el ${new Date().toLocaleString('es-ES')} · Buho-Gear · EPN - ESFOT`,
        14, 285
      );

      doc.save(`comprobante_${reserva.estudiante.replace(/\s+/g, '_')}_${reserva.fecha}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('No se pudo generar el comprobante.');
    } finally {
      setGenerandoPdfId(null);
    }
  };

  // Agrupa las reservas confirmadas por fecha, más reciente primero
  const reservasPorDia = confirmadas.reduce((acc, r) => {
    if (!acc[r.fecha]) acc[r.fecha] = [];
    acc[r.fecha].push(r);
    return acc;
  }, {});
  const fechasOrdenadas = Object.keys(reservasPorDia).sort((a, b) => b.localeCompare(a));

  // Fechas filtradas para el Reporte del Día
  const fechasFiltradas = filtroFechaReporte === 'todas'
    ? fechasOrdenadas
    : fechasOrdenadas.filter(f => f === filtroFechaReporte);

  // Horas disponibles para el filtro de Comprobantes (mismo generador que usa Estudiante)
  const horasDisponiblesFiltro = generarHorasDelDia();

  // Reservas confirmadas filtradas por hora para Comprobantes
  const confirmadasFiltradasComprobante = filtroHoraComprobante === 'todas'
    ? confirmadas
    : confirmadas.filter(r => r.horaInicio === filtroHoraComprobante);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/50">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur border-b border-blue-100 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 shadow-lg shadow-blue-900/30 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <polyline points="2,14 8,6 14,20 20,10 26,14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">Buho-Gear</span>
            <span className="text-xs text-slate-500">Sistema de Reservas Deportivas</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-800">
            <User size={18} />
          </div>
          <span className="text-sm font-medium text-slate-700">{nombreUsuario}</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1 rounded-full shadow-sm">Encargado</span>
          <button
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-xl transition-colors"
            onClick={() => navigate('/sign-up')}
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Alerta inventario bajo */}
        {bajosStock.length > 0 && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 shadow-sm">
            <span className="w-9 h-9 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="font-semibold text-sm text-amber-900">Atención: Inventario Bajo</p>
              <p className="text-sm text-amber-700">{bajosStock.length} artículos están por debajo del stock mínimo</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex flex-wrap gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 mb-6">
          {tabs.map((tab, i) => {
            const badge = i === 0 ? pendientes.length : i === 1 ? bajosStock.length : 0;
            const activo = tabActivo === i;
            return (
              <button
                key={tab}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activo
                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
                onClick={() => setTabActivo(i)}
              >
                {(() => { const Icon = TabIcon[i]; return <Icon size={16} />; })()}
                {tab}
                {badge > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ml-1 ${activo ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Reservas Pendientes', valor: pendientes.length,      color: 'naranja',  Icon: Clock },
            { label: 'Confirmadas Hoy',     valor: confirmadasHoy.length,  color: 'verde',    Icon: CheckCircle2 },
            { label: 'Items Bajo Stock',    valor: bajosStock.length,      color: 'rojo',     Icon: AlertTriangle },
            { label: 'Inventario Total',    valor: totalInventario,        color: 'azul',     Icon: Package },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                <p className={`text-3xl font-extrabold ${statStyle[s.color].numero}`}>{s.valor}</p>
              </div>
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${statStyle[s.color].icono} ${statStyle[s.color].numero}`}>
                <s.Icon size={22} />
              </span>
            </div>
          ))}
        </div>

        {/* Tab: Gestión de Reservas */}
        {tabActivo === 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Gestión de Reservas</h2>

            {cargando ? (
              <p className="text-center text-slate-400 text-sm py-8">Cargando reservas...</p>
            ) : (
              <>
                {pendientes.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-2">
                      Pendientes de Aprobación ({pendientes.length})
                    </h3>
                    <div className="flex flex-col gap-3 mb-8">
                      {pendientes.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between bg-white border-l-4 border-amber-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => abrirDetalle(r)}
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{r.cancha}</p>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                              <span>Estudiante: {r.estudiante}</span>
                              <span>Fecha: {r.fechaLabel}</span>
                              <span>Hora: {r.hora}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-md hover:scale-[1.02] text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
                              onClick={() => handleAprobar(r.id)}
                            >
                              <CheckCircle2 size={15} /> Aprobar
                            </button>
                            <button
                              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
                              onClick={() => handleRechazar(r)}
                            >
                              <XCircle size={15} /> Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-2">Todas las Reservas</h3>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto mb-8">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50 to-slate-50">
                        <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ESTUDIANTE</th>
                        <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">CANCHA</th>
                        <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">FECHA</th>
                        <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">HORA</th>
                        <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservas.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-slate-400 text-sm py-8">No hay reservas registradas.</td>
                        </tr>
                      ) : (
                        reservas.map((r) => (
                          <tr
                            key={r.id}
                            className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                            onClick={() => abrirDetalle(r)}
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">{r.estudiante}</td>
                            <td className="px-4 py-3 text-slate-600">{r.cancha}</td>
                            <td className="px-4 py-3 text-slate-600">{r.fechaLabel}</td>
                            <td className="px-4 py-3 text-slate-600">{r.hora}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                r.estado === 'confirmada' ? badgeColor.verde : badgeColor.amarillo
                              }`}>
                                {r.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Inventario */}
        {tabActivo === 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Inventario</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-slate-50">
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ARTÍCULO</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">CATEGORÍA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">STOCK ACTUAL</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">STOCK MÍNIMO</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">{item.categoria}</td>
                      <td className="px-4 py-3 text-slate-600">{item.stock}</td>
                      <td className="px-4 py-3 text-slate-600">{item.minimo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          item.stock < item.minimo ? badgeColor.rojo : badgeColor.verde
                        }`}>
                          {item.stock < item.minimo ? 'Bajo Stock' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Control de Horarios */}
        {tabActivo === 2 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">Control de Horarios</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-slate-50">
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ESTUDIANTE</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">CANCHA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">FECHA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">HORA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmadas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-slate-400 text-sm py-8">No hay reservas confirmadas.</td>
                    </tr>
                  ) : (
                    confirmadas.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{r.estudiante}</td>
                        <td className="px-4 py-3 text-slate-600">{r.cancha}</td>
                        <td className="px-4 py-3 text-slate-600">{r.fechaLabel}</td>
                        <td className="px-4 py-3 text-slate-600">{r.hora}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor.verde}`}>Confirmada</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Reporte del Día */}
        {tabActivo === 3 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Reporte del Día</h2>
                <p className="text-sm text-slate-500">Historial completo de reservas confirmadas, agrupadas por fecha.</p>
              </div>

              {fechasOrdenadas.length > 0 && (
                <div className="flex flex-col gap-1 sm:items-end">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Calendar size={13} /> Filtrar por fecha
                  </label>
                  <select
                    className="text-sm font-medium border border-slate-200 bg-white rounded-xl px-4 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 min-w-[220px]"
                    value={filtroFechaReporte}
                    onChange={(e) => setFiltroFechaReporte(e.target.value)}
                  >
                    <option value="todas">Todas las fechas</option>
                    {fechasOrdenadas.map((f) => (
                      <option key={f} value={f}>
                        {new Date(f + 'T12:00:00').toLocaleDateString('es-ES', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {confirmadas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400 text-sm">Todavía no hay reservas confirmadas.</p>
              </div>
            ) : fechasFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400 text-sm">No hay reservas confirmadas para la fecha seleccionada.</p>
              </div>
            ) : (
              fechasFiltradas.map((fechaGrupo) => (
                <div key={fechaGrupo} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center">
                      <Calendar size={16} />
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {new Date(fechaGrupo + 'T12:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </h3>
                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                      {reservasPorDia[fechaGrupo].length} reserva{reservasPorDia[fechaGrupo].length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {reservasPorDia[fechaGrupo].map((r) => (
                      <div key={r.id} className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          {thumbs[r.id] ? (
                            <img src={thumbs[r.id]} alt="Carnet" className="w-full h-full object-cover" />
                          ) : (
                            <CreditCard size={20} className="text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                          <p><span className="font-semibold text-slate-900">Estudiante:</span> <span className="text-slate-600">{r.estudiante}</span></p>
                          <p><span className="font-semibold text-slate-900">Cancha:</span> <span className="text-slate-600">{r.cancha}</span></p>
                          <p><span className="font-semibold text-slate-900">Hora reservada:</span> <span className="text-slate-600">{r.hora}</span></p>
                          <p><span className="font-semibold text-slate-900">Implementos:</span> <span className="text-slate-600">{r.deseaImplementos ? 'Sí' : 'No'}</span></p>
                          <p><span className="font-semibold text-slate-900">Hora de solicitud:</span> <span className="text-slate-600">{formatearFechaHora(r.creadoEn)}</span></p>
                          <p><span className="font-semibold text-slate-900">Hora de aprobación:</span> <span className="text-slate-600">{formatearFechaHora(r.actualizadoEn)}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {cargandoThumbs && (
              <p className="text-xs text-slate-400 mt-2">Cargando fotos de carnet...</p>
            )}
          </div>
        )}

        {/* Tab: Comprobantes (descargables en PDF) */}
        {tabActivo === 4 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Comprobantes</h2>
                <p className="text-sm text-slate-500">
                  Descarga el comprobante en PDF de cualquier reserva confirmada para entregárselo al estudiante.
                </p>
              </div>

              {confirmadas.length > 0 && (
                <div className="flex flex-col gap-1 sm:items-end">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock size={13} /> Filtrar por hora
                  </label>
                  <select
                    className="text-sm font-medium border border-slate-200 bg-white rounded-xl px-4 py-2 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500 min-w-[220px]"
                    value={filtroHoraComprobante}
                    onChange={(e) => setFiltroHoraComprobante(e.target.value)}
                  >
                    <option value="todas">Todas las horas</option>
                    {horasDisponiblesFiltro.map((h) => (
                      <option key={h.inicio} value={h.inicio}>{h.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-slate-50">
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">ESTUDIANTE</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">CANCHA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">FECHA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">HORA</th>
                    <th className="text-xs uppercase tracking-wide text-blue-800 font-semibold text-left px-4 py-3">COMPROBANTE</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmadas.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-slate-400 text-sm py-8">No hay reservas confirmadas.</td>
                    </tr>
                  ) : confirmadasFiltradasComprobante.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-slate-400 text-sm py-8">No hay reservas confirmadas para la hora seleccionada.</td>
                    </tr>
                  ) : (
                    confirmadasFiltradasComprobante.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors cursor-pointer"
                        onClick={() => abrirPreviewComprobante(r)}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">{r.estudiante}</td>
                        <td className="px-4 py-3 text-slate-600">{r.cancha}</td>
                        <td className="px-4 py-3 text-slate-600">{r.fechaLabel}</td>
                        <td className="px-4 py-3 text-slate-600">{r.hora}</td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                            onClick={() => generarComprobantePDF(r)}
                            disabled={generandoPdfId === r.id}
                          >
                            <Download size={14} />
                            {generandoPdfId === r.id ? 'Generando...' : 'Descargar PDF'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <button className="fixed bottom-6 right-6 w-13 h-13 p-3.5 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 hover:scale-110 text-white shadow-lg shadow-blue-900/40 flex items-center justify-center transition-transform">
        <HelpCircle size={22} />
      </button>

      {/* Modal de detalle de solicitud */}
      {detalleAbierto && detalleReserva && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setDetalleAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Detalle de la Solicitud</h2>
              <button
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                onClick={() => setDetalleAbierto(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-600 mb-5">
              <p><span className="font-semibold text-slate-900">Cancha:</span> {detalleReserva.cancha}</p>
              <p><span className="font-semibold text-slate-900">Estudiante:</span> {detalleReserva.estudiante}</p>
              <p><span className="font-semibold text-slate-900">Fecha de la reserva:</span> {detalleReserva.fechaLabel}</p>
              <p><span className="font-semibold text-slate-900">Hora reservada:</span> {detalleReserva.hora}</p>
              <p><span className="font-semibold text-slate-900">Hora de la solicitud:</span> {formatearFechaHora(detalleReserva.creadoEn)}</p>
              <p><span className="font-semibold text-slate-900">¿Pidió implementos?:</span> {detalleReserva.deseaImplementos ? 'Sí' : 'No'}</p>
            </div>

            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <CreditCard size={14} /> Carnet Estudiantil
            </p>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-5 flex items-center justify-center min-h-[180px]">
              {cargandoCarnet ? (
                <p className="text-xs text-slate-400 py-10">Cargando imagen...</p>
              ) : carnetUrl ? (
                <img src={carnetUrl} alt="Carnet estudiantil" className="w-full h-auto object-contain max-h-72" />
              ) : (
                <p className="text-xs text-slate-400 py-10">No se pudo cargar la imagen.</p>
              )}
            </div>

            {detalleReserva.estado === 'pendiente' && (
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-md text-white text-sm font-medium px-3 py-2.5 rounded-xl transition-all"
                  onClick={() => handleAprobar(detalleReserva.id)}
                >
                  <CheckCircle2 size={16} /> Aprobar
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium px-3 py-2.5 rounded-xl transition-colors"
                  onClick={() => handleRechazar(detalleReserva)}
                >
                  <XCircle size={16} /> Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista previa del comprobante (antes de descargar el PDF) */}
      {previewAbierto && previewReserva && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewAbierto(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Vista Previa del Comprobante</h2>
              <button
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                onClick={() => setPreviewAbierto(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-600 mb-5">
              <p><span className="font-semibold text-slate-900">Estudiante:</span> {previewReserva.estudiante}</p>
              <p><span className="font-semibold text-slate-900">Correo:</span> {previewReserva.estudianteEmail || '-'}</p>
              <p><span className="font-semibold text-slate-900">Cancha:</span> {previewReserva.cancha}</p>
              <p><span className="font-semibold text-slate-900">Fecha de la reserva:</span> {previewReserva.fechaLabel}</p>
              <p><span className="font-semibold text-slate-900">Hora reservada:</span> {previewReserva.hora}</p>
              <p><span className="font-semibold text-slate-900">Hora de solicitud:</span> {formatearFechaHora(previewReserva.creadoEn)}</p>
              <p><span className="font-semibold text-slate-900">Hora de aprobación:</span> {formatearFechaHora(previewReserva.actualizadoEn)}</p>
              <p><span className="font-semibold text-slate-900">Implementos prestados:</span> {previewReserva.deseaImplementos ? 'Sí' : 'No'}</p>
              <p><span className="font-semibold text-slate-900">Estado:</span> Confirmada</p>
            </div>

            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <CreditCard size={14} /> Carnet Estudiantil
            </p>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-5 flex items-center justify-center min-h-[150px]">
              {cargandoPreviewCarnet ? (
                <p className="text-xs text-slate-400 py-10">Cargando imagen...</p>
              ) : previewCarnetUrl ? (
                <img src={previewCarnetUrl} alt="Carnet estudiantil" className="w-full h-auto object-contain max-h-64" />
              ) : (
                <p className="text-xs text-slate-400 py-10">No se pudo cargar la imagen.</p>
              )}
            </div>

            <button
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-md text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition-all disabled:opacity-50"
              onClick={() => generarComprobantePDF(previewReserva)}
              disabled={generandoPdfId === previewReserva.id}
            >
              <Download size={16} />
              {generandoPdfId === previewReserva.id ? 'Generando...' : 'Descargar PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}