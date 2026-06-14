import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './encargado.css';

const reservasDemo = [
  { id: '1', estudiante: 'Juan Pérez',    cancha: 'Fútbol Principal', fecha: '14/5/2026', hora: '15:00', estado: 'pendiente' },
  { id: '2', estudiante: 'Ana Martínez',  cancha: 'Baloncesto',       fecha: '14/5/2026', hora: '16:00', estado: 'confirmada' },
  { id: '3', estudiante: 'Carlos López',  cancha: 'Fútbol Rápido',    fecha: '15/5/2026', hora: '10:00', estado: 'pendiente' },
  { id: '4', estudiante: 'María García',  cancha: 'Voleibol',         fecha: '15/5/2026', hora: '09:00', estado: 'confirmada' },
];

const inventarioDemo = [
  { id: '1', nombre: 'Balones de Fútbol',     stock: 5,  minimo: 10, categoria: 'Equipamiento' },
  { id: '2', nombre: 'Chalecos Deportivos',   stock: 3,  minimo: 8,  categoria: 'Indumentaria' },
  { id: '3', nombre: 'Conos de Entrenamiento',stock: 2,  minimo: 15, categoria: 'Equipamiento' },
  { id: '4', nombre: 'Balones de Baloncesto', stock: 12, minimo: 6,  categoria: 'Equipamiento' },
  { id: '5', nombre: 'Redes de Voleibol',     stock: 4,  minimo: 3,  categoria: 'Infraestructura' },
  { id: '6', nombre: 'Cronómetros',           stock: 32, minimo: 5,  categoria: 'Tecnología' },
];

const tabs = ['Gestión de Reservas', 'Inventario', 'Control de Horarios'];
const tabIcons = ['📅', '📦', '🕐'];

export default function Encargado() {
  const navigate = useNavigate();
  const [tabActivo, setTabActivo] = useState(0);
  const [reservas, setReservas] = useState(reservasDemo);
  const [inventario] = useState(inventarioDemo);

  const pendientes = reservas.filter(r => r.estado === 'pendiente');
  const confirmadas = reservas.filter(r => r.estado === 'confirmada');
  const bajosStock = inventario.filter(i => i.stock < i.minimo);
  const totalInventario = inventario.reduce((sum, i) => sum + i.stock, 0);

  const handleAprobar = (id) => {
    setReservas(reservas.map(r => r.id === id ? { ...r, estado: 'confirmada' } : r));
  };

  const handleRechazar = (id) => {
    if (window.confirm('¿Rechazar esta reserva?')) {
      setReservas(reservas.filter(r => r.id !== id));
    }
  };

  return (
    <div className="enc-app">

      {/* Header */}
      <header className="enc-header">
        <div className="enc-header-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polyline points="2,14 8,6 14,20 20,10 26,14" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <div>
            <span className="enc-header-titulo">Buho-Gear</span>
            <span className="enc-header-sub">Sistema de Reservas Deportivas</span>
          </div>
        </div>

        <div className="enc-header-usuario">
          <div className="enc-header-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span className="enc-header-nombre">Carlos Rodríguez</span>
          <span className="enc-badge-rol">Encargado</span>
          <button className="enc-btn-salir" onClick={() => navigate('/sign-up')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      <main className="enc-main">

        {/* Alerta inventario bajo */}
        {bajosStock.length > 0 && (
          <div className="enc-alerta">
            <span className="enc-alerta-icono">⚠️</span>
            <div>
              <p className="enc-alerta-titulo">Atención: Inventario Bajo</p>
              <p className="enc-alerta-texto">{bajosStock.length} artículos están por debajo del stock mínimo</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="enc-tabs-wrapper">
          <nav className="enc-tabs">
            {tabs.map((tab, i) => {
              const badge = i === 0 ? pendientes.length : i === 1 ? bajosStock.length : 0;
              return (
                <button
                  key={tab}
                  className={`enc-tab ${tabActivo === i ? 'activo' : ''}`}
                  onClick={() => setTabActivo(i)}
                >
                  <span>{tabIcons[i]}</span>
                  {tab}
                  {badge > 0 && <span className="enc-tab-badge">{badge}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Stats */}
        <div className="enc-stats">
          {[
            { label: 'Reservas Pendientes', valor: pendientes.length,      color: 'naranja',  icon: '🕐' },
            { label: 'Confirmadas Hoy',     valor: confirmadas.length,     color: 'verde',    icon: '✅' },
            { label: 'Items Bajo Stock',    valor: bajosStock.length,      color: 'rojo',     icon: '⚠️' },
            { label: 'Inventario Total',    valor: totalInventario,        color: 'azul',     icon: '📦' },
          ].map((s) => (
            <div key={s.label} className="enc-stat-card">
              <div>
                <p className="enc-stat-label">{s.label}</p>
                <p className={`enc-stat-numero ${s.color}`}>{s.valor}</p>
              </div>
              <span className="enc-stat-icono">{s.icon}</span>
            </div>
          ))}
        </div>

        {/* Tab: Gestión de Reservas */}
        {tabActivo === 0 && (
          <div>
            <h2 className="enc-seccion-titulo">Gestión de Reservas</h2>

            {pendientes.length > 0 && (
              <>
                <h3 className="enc-subseccion-titulo">Pendientes de Aprobación ({pendientes.length})</h3>
                <div className="enc-pendientes-lista">
                  {pendientes.map((r) => (
                    <div key={r.id} className="enc-pendiente-card">
                      <div className="enc-pendiente-info">
                        <p className="enc-pendiente-cancha">{r.cancha}</p>
                        <div className="enc-pendiente-detalles">
                          <span>Estudiante: {r.estudiante}</span>
                          <span>Fecha: {r.fecha}</span>
                          <span>Hora: {r.hora}</span>
                        </div>
                      </div>
                      <div className="enc-pendiente-acciones">
                        <button className="enc-btn-aprobar" onClick={() => handleAprobar(r.id)}>
                          ✅ Aprobar
                        </button>
                        <button className="enc-btn-rechazar" onClick={() => handleRechazar(r.id)}>
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h3 className="enc-subseccion-titulo">Todas las Reservas</h3>
            <div className="enc-tabla-wrapper">
              <table className="enc-tabla">
                <thead>
                  <tr>
                    <th>ESTUDIANTE</th>
                    <th>CANCHA</th>
                    <th>FECHA</th>
                    <th>HORA</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id}>
                      <td className="enc-tabla-bold">{r.estudiante}</td>
                      <td>{r.cancha}</td>
                      <td>{r.fecha}</td>
                      <td>{r.hora}</td>
                      <td>
                        <span className={`enc-badge ${r.estado === 'confirmada' ? 'badge-verde' : 'badge-amarillo'}`}>
                          {r.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Inventario */}
        {tabActivo === 1 && (
          <div>
            <h2 className="enc-seccion-titulo">Inventario</h2>
            <div className="enc-tabla-wrapper">
              <table className="enc-tabla">
                <thead>
                  <tr>
                    <th>ARTÍCULO</th>
                    <th>CATEGORÍA</th>
                    <th>STOCK ACTUAL</th>
                    <th>STOCK MÍNIMO</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item) => (
                    <tr key={item.id}>
                      <td className="enc-tabla-bold">{item.nombre}</td>
                      <td>{item.categoria}</td>
                      <td>{item.stock}</td>
                      <td>{item.minimo}</td>
                      <td>
                        <span className={`enc-badge ${item.stock < item.minimo ? 'badge-rojo' : 'badge-verde'}`}>
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
            <h2 className="enc-seccion-titulo">Control de Horarios</h2>
            <div className="enc-tabla-wrapper">
              <table className="enc-tabla">
                <thead>
                  <tr>
                    <th>ESTUDIANTE</th>
                    <th>CANCHA</th>
                    <th>FECHA</th>
                    <th>HORA</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.filter(r => r.estado === 'confirmada').map((r) => (
                    <tr key={r.id}>
                      <td className="enc-tabla-bold">{r.estudiante}</td>
                      <td>{r.cancha}</td>
                      <td>{r.fecha}</td>
                      <td>{r.hora}</td>
                      <td>
                        <span className="enc-badge badge-verde">Confirmada</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <button className="enc-help-btn">?</button>
    </div>
  );
}