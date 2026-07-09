import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './estudiante.css';
import { supabase } from '../supaBase/supabaseClient';
import Permisos from '../permisiones/permisiones';
import { canchasDemo, generarHorasDelDia } from '../data/canchasData';

const tabs = ['Canchas Disponibles', 'Mis Reservas'];
const tabIcons = ['📅', '🕐'];

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

  // Trae las horas ocupadas desde Supabase para la SUBCANCHA seleccionada
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

  // Trae las reservas reales del usuario logueado desde Supabase
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

  // Se llama cuando Permisos.jsx confirma la reserva, para refrescar la grilla
  const handleReservaCreada = () => {
    setMostrarPermisos(false);
    setSubcanchaSeleccionada({ ...subcanchaSeleccionada }); // fuerza recarga del useEffect
  };

  const reservasFiltradas = filtro === 'todas'
    ? reservas
    : reservas.filter(r => r.estado === filtro);

  const fechaFormateada = new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Objeto combinado que se le pasa al modal de reserva (identifica la subcancha exacta)
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
    <div className="est-app">

      {/* Header */}
      <header className="est-header">
        <div className="est-header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polyline
              points="2,14 8,6 14,20 20,10 26,14"
              stroke="#4F46E5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <div>
            <span className="est-header-nombre">Buho-Gear</span>
            <span className="est-header-sub">Sistema de Reservas Deportivas</span>
          </div>
        </div>

        <div className="est-header-usuario">
          <div className="est-header-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="est-header-info">
            <span className="est-header-nombre-user">{nombreUsuario}</span>
            <span className="est-header-carrera">Ingeniería de Sistemas</span>
          </div>
          <span className="est-badge-rol">Estudiante</span>
          <button className="est-btn-salir" onClick={() => navigate('/sign-up')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="est-tabs">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`est-tab ${tabActivo === i ? 'activo' : ''}`}
            onClick={() => setTabActivo(i)}
          >
            <span>{tabIcons[i]}</span> {tab}
          </button>
        ))}
      </nav>

      {/* Contenido */}
      <main className="est-main">

        {/* Tab: Canchas Disponibles */}
        {tabActivo === 0 && (
          <div>
            <div className="est-canchas-grid">
              {canchasDemo.map((cancha) => (
                <div
                  key={cancha.id}
                  className={`est-cancha-card ${canchaSeleccionada?.id === cancha.id ? 'seleccionada' : ''}`}
                  onClick={() => handleCanchaClick(cancha)}
                >
                  <div className="est-cancha-img">
                    <span className="est-cancha-emoji">{cancha.emoji}</span>
                  </div>
                  <div className="est-cancha-body">
                    <h3 className="est-cancha-nombre">{cancha.nombre}</h3>
                    <p className="est-cancha-detalle">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {cancha.ubicacion}
                    </p>
                    <p className="est-cancha-detalle">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      Capacidad: {cancha.capacidad} personas
                    </p>
                    <span className="est-cancha-tipo">{cancha.tipo}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de subcanchas */}
            {canchaSeleccionada && (
              <div className="est-subcanchas-card">
                <h2 className="est-subcanchas-titulo">Selecciona la cancha específica</h2>
                <div className="est-subcanchas-grid">
                  {canchaSeleccionada.subcanchas.map((sub) => (
                    <button
                      key={sub.id}
                      className={`est-subcancha-btn ${subcanchaSeleccionada?.id === sub.id ? 'activo' : ''}`}
                      onClick={() => handleSubcanchaClick(sub)}
                    >
                      {sub.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Horarios de la subcancha seleccionada */}
            {subcanchaSeleccionada && (
              <div className="est-horarios-card">
                <div className="est-horarios-header-row">
                  <div>
                    <h2 className="est-horarios-titulo">
                      <span>🕐</span> Horarios Disponibles - {canchaSeleccionada.nombre} · {subcanchaSeleccionada.nombre}
                    </h2>
                    <p className="est-horarios-fecha">Fecha seleccionada: {fechaFormateada}</p>
                  </div>

                  <div className="est-hora-filtro">
                    <label className="est-hora-filtro-label">Filtrar por hora</label>
                    <select
                      className="est-hora-filtro-select"
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
                  <p className="est-horarios-fecha">Cargando horarios...</p>
                ) : (
                  <div className="est-horarios-grid">
                    {horariosMostrados.map((slot) => (
                      <div
                        key={slot.horaInicio}
                        className={`est-slot ${slot.disponible ? 'disponible' : 'ocupado'}`}
                        onClick={() => handleSlotClick(slot)}
                      >
                        <span className="est-slot-icono">
                          {slot.disponible ? '✅' : '❌'}
                        </span>
                        <span className="est-slot-hora">{slot.hora}</span>
                        <span className="est-slot-estado">
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
            <div className="est-card">
              <h2 className="est-seccion-titulo">Filtrar por estado</h2>
              <div className="est-filtros">
                {['todas', 'confirmada', 'pendiente'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltro(f)}
                    className={`est-filtro-btn ${filtro === f ? `activo-${f}` : ''}`}
                  >
                    {f === 'todas' ? 'Todas' : f === 'confirmada' ? 'Confirmadas' : 'Pendientes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="est-stats">
              {[
                { label: 'Total Reservas', valor: reservas.length, color: 'azul', icon: '📅' },
                { label: 'Confirmadas', valor: reservas.filter(r => r.estado === 'confirmada').length, color: 'verde', icon: '✅' },
                { label: 'Pendientes', valor: reservas.filter(r => r.estado === 'pendiente').length, color: 'amarillo', icon: '🕐' },
              ].map((s) => (
                <div key={s.label} className="est-stat-card">
                  <div>
                    <p className="est-stat-label">{s.label}</p>
                    <p className={`est-stat-numero ${s.color}`}>{s.valor}</p>
                  </div>
                  <span className="est-stat-icono">{s.icon}</span>
                </div>
              ))}
            </div>

            <div className="est-lista">
              {cargandoReservas ? (
                <div className="est-vacio">
                  <p className="est-vacio-texto">Cargando tus reservas...</p>
                </div>
              ) : reservasFiltradas.length === 0 ? (
                <div className="est-vacio">
                  <p className="est-vacio-icono">📅</p>
                  <p className="est-vacio-texto">No tienes reservas en este momento.</p>
                </div>
              ) : (
                reservasFiltradas.map((r) => (
                  <div key={r.id} className="est-reserva-card">
                    <div className="est-reserva-info">
                      <div className="est-reserva-header">
                        <h3 className="est-reserva-nombre">{r.canchaNombre}</h3>
                        <span className={`est-badge ${r.estado === 'confirmada' ? 'badge-verde' : 'badge-amarillo'}`}>
                          {r.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="est-reserva-detalles">
                        <p>📅 {new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}</p>
                        <p>🕐 {r.horaInicio} - {r.horaFin}</p>
                        <p>📍 {r.ubicacion}</p>
                      </div>
                    </div>
                    <button onClick={() => handleCancelar(r.id)} className="est-btn-cancelar">
                      🗑 Cancelar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Botón ayuda */}
      <button className="est-help-btn">?</button>

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