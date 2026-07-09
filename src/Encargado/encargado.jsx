import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './encargado.css';
import { supabase } from '../supaBase/supabaseClient';
import { buscarInfoSubcancha, IMPLEMENTOS_POR_CATEGORIA } from '../data/canchasData';

const tabs = ['Gestión de Reservas', 'Inventario', 'Control de Horarios'];
const tabIcons = ['📅', '📦', '🕐'];

export default function Encargado() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const [tabActivo, setTabActivo] = useState(0);
  const [reservas, setReservas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [cargando, setCargando] = useState(false);

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
      .order('fecha', { ascending: true })
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
        cancha: info
          ? `${info.canchaPrincipal.nombre} · ${info.subcancha.nombre}`
          : r.cancha_id,
        fecha: r.fecha,
        fechaLabel: new Date(r.fecha + 'T12:00:00').toLocaleDateString('es-ES'),
        hora: `${r.hora_inicio} - ${r.hora_fin}`,
        estado: r.estado,
        categoria: r.categoria,
        deseaImplementos: r.desea_implementos
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
  const confirmadasHoy = reservas.filter(r => r.estado === 'confirmada' && r.fecha === today);
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

    // Si el estudiante había pedido implementos, se devuelven al inventario
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

    cargarReservas();
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
          <span className="enc-header-nombre">{nombreUsuario}</span>
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
            { label: 'Confirmadas Hoy',     valor: confirmadasHoy.length,  color: 'verde',    icon: '✅' },
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

            {cargando ? (
              <p className="enc-vacio-texto">Cargando reservas...</p>
            ) : (
              <>
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
                              <span>Fecha: {r.fechaLabel}</span>
                              <span>Hora: {r.hora}</span>
                            </div>
                          </div>
                          <div className="enc-pendiente-acciones">
                            <button className="enc-btn-aprobar" onClick={() => handleAprobar(r.id)}>
                              ✅ Aprobar
                            </button>
                            <button className="enc-btn-rechazar" onClick={() => handleRechazar(r)}>
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
                      {reservas.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="enc-vacio-texto">No hay reservas registradas.</td>
                        </tr>
                      ) : (
                        reservas.map((r) => (
                          <tr key={r.id}>
                            <td className="enc-tabla-bold">{r.estudiante}</td>
                            <td>{r.cancha}</td>
                            <td>{r.fechaLabel}</td>
                            <td>{r.hora}</td>
                            <td>
                              <span className={`enc-badge ${r.estado === 'confirmada' ? 'badge-verde' : 'badge-amarillo'}`}>
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
                  {reservas.filter(r => r.estado === 'confirmada').length === 0 ? (
                    <tr>
                      <td colSpan="5" className="enc-vacio-texto">No hay reservas confirmadas.</td>
                    </tr>
                  ) : (
                    reservas.filter(r => r.estado === 'confirmada').map((r) => (
                      <tr key={r.id}>
                        <td className="enc-tabla-bold">{r.estudiante}</td>
                        <td>{r.cancha}</td>
                        <td>{r.fechaLabel}</td>
                        <td>{r.hora}</td>
                        <td>
                          <span className="enc-badge badge-verde">Confirmada</span>
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

      <button className="enc-help-btn">?</button>
    </div>
  );
}