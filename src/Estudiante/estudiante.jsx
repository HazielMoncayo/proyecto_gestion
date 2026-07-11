import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, XCircle, MapPin, Users, LogOut, User, HelpCircle, Trash2 } from 'lucide-react';
import { supabase } from '../supaBase/supabaseClient';
import Permisos from '../permisiones/permisiones';
import { canchasDemo, generarHorasDelDia } from '../data/canchasData';

const tabs = ['Canchas Disponibles', 'Mis Reservas'];
const TabIcon = [Calendar, Clock];

const statStyle = {
  azul:     { numero: 'text-blue-800', icono: 'bg-blue-100' },
  verde:    { numero: 'text-emerald-600', icono: 'bg-emerald-100' },
  amarillo: { numero: 'text-amber-500', icono: 'bg-amber-100' },
};

const filtroActivoClase = {
  todas: 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30',
  confirmada: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30',
  pendiente: 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/30',
};

export default function Estudiante() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [tabActivo, setTabActivo] = useState(0);
  const fecha = today;
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [subcanchaSeleccionada, setSubcanchaSeleccionada] = useState(null);
  const [horaFiltro, setHoraFiltro] = useState('ninguno');
  const [reservas, setReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [mostrarPermisos, setMostrarPermisos] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [horariosCancha, setHorariosCancha] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  useEffect(() => {
    async function obtenerUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNombreUsuario(user.user_metadata?.nombre || '');
        setUsuarioActual(user);
      }
    }
    obtenerUsuario();
  }, []);

  useEffect(() => {
    if (!subcanchaSeleccionada) {
      setHorariosCancha([]);
      return;
    }

    async function cargarHorarios() {
      setCargandoHorarios(true);

      const { data: ocupadas, error } = await supabase
        .from('reservas')
        .select('hora_inicio')
        .eq('cancha_id', subcanchaSeleccionada.id)
        .eq('fecha', fecha)
        .neq('estado', 'cancelada');

      if (error) {
        console.error('Error al cargar horarios:', error);
        setCargandoHorarios(false);
        return;
      }

      const horasOcupadas = ocupadas.map(r => r.hora_inicio);
      const todasLasHoras = generarHorasDelDia();

      const conEstado = todasLasHoras.map(h => ({
        horaInicio: h.inicio,
        horaFin: h.fin,
        hora: h.label,
        disponible: !horasOcupadas.includes(h.inicio)
      }));

      setHorariosCancha(conEstado);
      setCargandoHorarios(false);
    }

    cargarHorarios();
  }, [subcanchaSeleccionada, fecha]);

  const cargarMisReservas = async () => {
    if (!usuarioActual) return;

    setCargandoReservas(true);

    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('usuario_id', usuarioActual.id)
      .neq('estado', 'cancelada')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true });

    if (error) {
      console.error('Error al cargar mis reservas:', error);
      setCargandoReservas(false);
      return;
    }

    const { buscarInfoSubcancha } = await import('../data/canchasData');

    const reservasConNombre = data.map((r) => {
      const info = buscarInfoSubcancha(r.cancha_id);
      return {
        id: r.id,
        canchaNombre: info
          ? `${info.canchaPrincipal.nombre} · ${info.subcancha.nombre}`
          : r.cancha_id,
        ubicacion: info ? info.canchaPrincipal.ubicacion : '',
        fecha: r.fecha,
        horaInicio: r.hora_inicio,
        horaFin: r.hora_fin,
        estado: r.estado
      };
    });

    setReservas(reservasConNombre);
    setCargandoReservas(false);
  };

  useEffect(() => {
    if (tabActivo === 1 && usuarioActual) {
      cargarMisReservas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabActivo, usuarioActual]);

  const handleCanchaClick = (cancha) => {
    setCanchaSeleccionada(cancha);
    setSubcanchaSeleccionada(cancha.subcanchas[0]);
    setHoraFiltro('ninguno');
  };

  const handleSubcanchaClick = (subcancha) => {
    setSubcanchaSeleccionada(subcancha);
    setHoraFiltro('ninguno');
  };

  const handleCancelar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'cancelada' })
      .eq('id', id);

    if (error) {
      console.error('Error al cancelar:', error);
      alert('No se pudo cancelar la reserva. Intenta de nuevo.');
      return;
    }

    setReservas(reservas.filter(r => r.id !== id));
  };

  const handleSlotClick = (slot) => {
    if (slot.disponible) {
      setSlotSeleccionado(slot);
      setMostrarPermisos(true);
    }
  };

  const handleReservaCreada = () => {
    setMostrarPermisos(false);
    setSubcanchaSeleccionada({ ...subcanchaSeleccionada });
  };

  const reservasFiltradas = filtro === 'todas'
    ? reservas
    : reservas.filter(r => r.estado === filtro);

  const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const canchaParaReserva = canchaSeleccionada && subcanchaSeleccionada
    ? {
        id: subcanchaSeleccionada.id,
        nombre: `${canchaSeleccionada.nombre} · ${subcanchaSeleccionada.nombre}`,
        categoria: canchaSeleccionada.categoria
      }
    : null;

  const horasDisponiblesParaFiltro = generarHorasDelDia();

  const horariosMostrados = horaFiltro === 'ninguno'
    ? horariosCancha
    : horariosCancha.filter(h => h.horaInicio === horaFiltro);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/50">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/90 backdrop-blur border-b border-blue-100 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 shadow-lg shadow-blue-900/30 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <polyline
                points="2,14 8,6 14,20 20,10 26,14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
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
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium text-slate-700">{nombreUsuario}</span>
            <span className="text-xs text-slate-500">Ingeniería de Sistemas</span>
          </div>
          <span className="text-xs font-semibold bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1 rounded-full shadow-sm">Estudiante</span>
          <button
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-xl transition-colors"
            onClick={() => navigate('/sign-up')}
          >
            <LogOut size={15} />
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <nav className="inline-flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
          {tabs.map((tab, i) => {
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
                {(() => { const Icon = TabIcon[i]; return <Icon size={16} />; })()} {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Tab: Canchas Disponibles */}
        {tabActivo === 0 && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {canchasDemo.map((cancha) => {
                const seleccionada = canchaSeleccionada?.id === cancha.id;
                return (
                  <div
                    key={cancha.id}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 overflow-hidden cursor-pointer transition-all ${
                      seleccionada ? 'border-blue-800 ring-2 ring-blue-200' : 'border-slate-100'
                    }`}
                    onClick={() => handleCanchaClick(cancha)}
                  >
                    <div className="h-28 bg-gradient-to-br from-blue-100 via-blue-50 to-slate-50 flex items-center justify-center">
                      <span className="text-5xl drop-shadow-sm">{cancha.emoji}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-1">{cancha.nombre}</h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <MapPin size={13} />
                        {cancha.ubicacion}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <Users size={13} />
                        Capacidad: {cancha.capacidad} personas
                      </p>
                      <span className="inline-block text-xs font-semibold bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1 rounded-full">
                        {cancha.tipo}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botones de subcanchas */}
            {canchaSeleccionada && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mt-6">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Selecciona la cancha específica</h2>
                <div className="flex flex-wrap gap-2">
                  {canchaSeleccionada.subcanchas.map((sub) => {
                    const activo = subcanchaSeleccionada?.id === sub.id;
                    return (
                      <button
                        key={sub.id}
                        className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${
                          activo
                            ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-md shadow-blue-900/30'
                            : 'bg-slate-50 text-slate-600 hover:bg-blue-50'
                        }`}
                        onClick={() => handleSubcanchaClick(sub)}
                      >
                        {sub.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Horarios de la subcancha seleccionada */}
            {subcanchaSeleccionada && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 tracking-tight">
                      <Clock size={18} /> Horarios Disponibles - {canchaSeleccionada.nombre} · {subcanchaSeleccionada.nombre}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Fecha seleccionada: {fechaFormateada}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-500">Filtrar por hora</label>
                    <select
                      className="text-sm border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      value={horaFiltro}
                      onChange={(e) => setHoraFiltro(e.target.value)}
                    >
                      <option value="ninguno">Ninguno</option>
                      {horasDisponiblesParaFiltro.map((h) => (
                        <option key={h.inicio} value={h.inicio}>{h.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {cargandoHorarios ? (
                  <p className="text-sm text-slate-500">Cargando horarios...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {horariosMostrados.map((slot) => (
                      <div
                        key={slot.horaInicio}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-center transition-all ${
                          slot.disponible
                            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200 text-emerald-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                            : 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                        }`}
                        onClick={() => handleSlotClick(slot)}
                      >
                        {slot.disponible
                          ? <CheckCircle2 size={20} />
                          : <XCircle size={20} />}
                        <span className="text-sm font-semibold">{slot.hora}</span>
                        <span className="text-xs">
                          {slot.disponible ? 'Disponible' : 'Ocupado'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Mis Reservas */}
        {tabActivo === 1 && (
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Filtrar por estado</h2>
              <div className="flex gap-2">
                {['todas', 'confirmada', 'pendiente'].map((f) => {
                  const activo = filtro === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFiltro(f)}
                      className={`text-sm font-medium px-4 py-2 rounded-full transition-all ${
                        activo ? filtroActivoClase[f] : 'bg-slate-50 text-slate-600 hover:bg-blue-50'
                      }`}
                    >
                      {f === 'todas' ? 'Todas' : f === 'confirmada' ? 'Confirmadas' : 'Pendientes'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Reservas', valor: reservas.length, color: 'azul', Icon: Calendar },
                { label: 'Confirmadas', valor: reservas.filter(r => r.estado === 'confirmada').length, color: 'verde', Icon: CheckCircle2 },
                { label: 'Pendientes', valor: reservas.filter(r => r.estado === 'pendiente').length, color: 'amarillo', Icon: Clock },
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

            <div className="flex flex-col gap-3">
              {cargandoReservas ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                  <p className="text-slate-400 text-sm">Cargando tus reservas...</p>
                </div>
              ) : reservasFiltradas.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                  <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-400 text-sm">No tienes reservas en este momento.</p>
                </div>
              ) : (
                reservasFiltradas.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-slate-900">{r.canchaNombre}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          r.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                        <p className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                        <p className="flex items-center gap-1.5"><Clock size={13} /> {r.horaInicio} - {r.horaFin}</p>
                        <p className="flex items-center gap-1.5"><MapPin size={13} /> {r.ubicacion}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelar(r.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 size={15} /> Cancelar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Botón ayuda */}
      <button className="fixed bottom-6 right-6 w-13 h-13 p-3.5 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 hover:scale-110 text-white shadow-lg shadow-blue-900/40 flex items-center justify-center transition-transform">
        <HelpCircle size={22} />
      </button>

      {/* Modal de Permisos */}
      {mostrarPermisos && (
        <Permisos
          cancha={canchaParaReserva}
          fecha={fecha}
          fechaFormateada={fechaFormateada}
          slot={slotSeleccionado}
          onClose={() => setMostrarPermisos(false)}
          onReservaCreada={handleReservaCreada}
        />
      )}
    </div>
  );
}
