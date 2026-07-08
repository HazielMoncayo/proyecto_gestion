import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './estudiante.css';
import { supabase } from '../supaBase/supabaseClient';
import Permisos from '../permisiones/permisiones';

const canchasDemo = [
  {
    id: 'futbol-principal',
    nombre: 'Cancha de Fútbol Principal',
    ubicacion: 'Zona Deportiva A',
    capacidad: 22,
    tipo: 'Fútbol 11',
    emoji: '🏟️',
    subcanchas: [
      { id: 'fp-1', nombre: 'Cancha 1' },
      { id: 'fp-2', nombre: 'Cancha 2' },
      { id: 'fp-3', nombre: 'Cancha 3' },
    ]
  },
  {
    id: 'futbol-sala',
    nombre: 'Cancha de Fútbol Sala',
    ubicacion: 'Zona Deportiva B',
    capacidad: 14,
    tipo: 'Fútbol Sala',
    emoji: '⚽',
    subcanchas: [
      { id: 'fs-1', nombre: 'Cancha 1 · La Bombonera' },
      { id: 'multiuso-basquet-futsal', nombre: 'Cancha 2 · Multiuso' },
    ]
  },
  {
    id: 'baloncesto',
    nombre: 'Cancha de Baloncesto',
    ubicacion: 'Zona Deportiva C',
    capacidad: 10,
    tipo: 'Baloncesto',
    emoji: '🏀',
    subcanchas: [
      { id: 'bq-1', nombre: 'Cancha 1' },
      { id: 'bq-2', nombre: 'Cancha 2' },
      { id: 'multiuso-basquet-futsal', nombre: 'Cancha 3 · Multiuso' },
    ]
  },
  {
    id: 'voleibol',
    nombre: 'Cancha de Voleibol',
    ubicacion: 'Zona Deportiva D',
    capacidad: 12,
    tipo: 'Voleibol',
    emoji: '🏐',
    subcanchas: [
      { id: 'vb-1', nombre: 'Cancha 1' },
      { id: 'vb-2', nombre: 'Cancha 2' },
      { id: 'vb-3', nombre: 'Cancha 3' },
    ]
  },
];

// Genera las horas del día, de 08:00 a 20:00, en formato "08:00 - 09:00"
const generarHorasDelDia = () => {
  const horas = [];
  for (let h = 8; h <= 20; h++) {
    const inicio = `${h.toString().padStart(2, '0')}:00`;
    const fin = `${(h + 1).toString().padStart(2, '0')}:00`;
    horas.push({ inicio, fin, label: `${inicio} - ${fin}` });
  }
  return horas;
};

const reservasDemoData = [
  {
    id: '1',
    canchaNombre: 'Cancha de Fútbol Principal',
    fecha: '2026-12-15',
    hora: '15:00',
    ubicacion: 'Zona Deportiva A',
    tipo: 'Fútbol 11',
    estado: 'confirmada'
  },
  {
    id: '2',
    canchaNombre: 'Cancha de Baloncesto',
    fecha: '2026-12-16',
    hora: '10:00',
    ubicacion: 'Zona Deportiva C',
    tipo: 'Baloncesto',
    estado: 'confirmada'
  },
  {
    id: '3',
    canchaNombre: 'Cancha de Fútbol Sala',
    fecha: '2026-12-18',
    hora: '18:00',
    ubicacion: 'Zona Deportiva B',
    tipo: 'Fútbol Sala',
    estado: 'pendiente'
  }
];

const tabs = ['Canchas Disponibles', 'Mis Reservas', 'Análisis de Uso'];
const tabIcons = ['📅', '🕐', '📈'];

export default function Estudiante() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [tabActivo, setTabActivo] = useState(0);
  const [fecha, setFecha] = useState(today);
  const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
  const [subcanchaSeleccionada, setSubcanchaSeleccionada] = useState(null);
  const [reservas, setReservas] = useState(reservasDemoData);
  const [filtro, setFiltro] = useState('todas');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [mostrarPermisos, setMostrarPermisos] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [horariosCancha, setHorariosCancha] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  useEffect(() => {
    async function obtenerUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setNombreUsuario(user.user_metadata?.nombre || '');
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

  const handleCanchaClick = (cancha) => {
    setCanchaSeleccionada(cancha);
    setSubcanchaSeleccionada(cancha.subcanchas[0]);
  };

  const handleSubcanchaClick = (subcancha) => {
    setSubcanchaSeleccionada(subcancha);
  };

  const handleCancelar = (id) => {
    if (window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
      setReservas(reservas.filter(r => r.id !== id));
    }
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
        nombre: `${canchaSeleccionada.nombre} · ${subcanchaSeleccionada.nombre}`
      }
    : null;

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
            <div className="est-fecha-card">
              <label className="est-fecha-label">Selecciona la fecha</label>
              <input
                type="date"
                className="est-fecha-input"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value);
                  setCanchaSeleccionada(null);
                  setSubcanchaSeleccionada(null);
                }}
              />
            </div>

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
                <h2 className="est-horarios-titulo">
                  <span>🕐</span> Horarios Disponibles - {canchaSeleccionada.nombre} · {subcanchaSeleccionada.nombre}
                </h2>
                <p className="est-horarios-fecha">Fecha seleccionada: {fechaFormateada}</p>

                {cargandoHorarios ? (
                  <p className="est-horarios-fecha">Cargando horarios...</p>
                ) : (
                  <div className="est-horarios-grid">
                    {horariosCancha.map((slot) => (
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
              {reservasFiltradas.length === 0 ? (
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
                        <p>🕐 {r.hora} - {parseInt(r.hora.split(':')[0]) + 1}:00</p>
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

        {/* Tab: Análisis de Uso */}
        {tabActivo === 2 && (
          <div className="est-vacio">
            <p className="est-vacio-icono">📈</p>
            <p className="est-vacio-texto">Análisis de uso próximamente disponible.</p>
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