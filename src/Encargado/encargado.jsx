import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supaBase/supabaseClient';
import { buscarInfoSubcancha, IMPLEMENTOS_POR_CATEGORIA } from '../data/canchasData';

const tabs = ['Gestión de Reservas', 'Inventario', 'Control de Horarios'];
const tabIcons = ['📅', '📦', '🕐'];

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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-700">{nombreUsuario}</span>
          <span className="text-xs font-semibold bg-gradient-to-r from-blue-700 to-blue-900 text-white px-3 py-1 rounded-full shadow-sm">Encargado</span>
          <button
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-xl transition-colors"
            onClick={() => navigate('/')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Alerta inventario bajo */}
        {bajosStock.length > 0 && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3 mb-6 shadow-sm">
            <span className="w-9 h-9 rounded-xl bg-amber-400 text-white flex items-center justify-center text-lg shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-sm text-amber-900">Atención: Inventario Bajo</p>
              <p className="text-sm text-amber-700">{bajosStock.length} artículos están por debajo del stock mínimo</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="inline-flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 mb-6">
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
                <span>{tabIcons[i]}</span>
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
            { label: 'Reservas Pendientes', valor: pendientes.length,      color: 'naranja',  icon: '🕐' },
            { label: 'Confirmadas Hoy',     valor: confirmadasHoy.length,  color: 'verde',    icon: '✅' },
            { label: 'Items Bajo Stock',    valor: bajosStock.length,      color: 'rojo',     icon: '⚠️' },
            { label: 'Inventario Total',    valor: totalInventario,        color: 'azul',     icon: '📦' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                <p className={`text-3xl font-extrabold ${statStyle[s.color].numero}`}>{s.valor}</p>
              </div>
              <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${statStyle[s.color].icono}`}>{s.icon}</span>
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
                        <div key={r.id} className="flex items-center justify-between bg-white border-l-4 border-amber-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div>
                            <p className="font-semibold text-slate-900">{r.cancha}</p>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                              <span>Estudiante: {r.estudiante}</span>
                              <span>Fecha: {r.fechaLabel}</span>
                              <span>Hora: {r.hora}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-md hover:scale-[1.02] text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-all"
                              onClick={() => handleAprobar(r.id)}
                            >
                              ✅ Aprobar
                            </button>
                            <button
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
                              onClick={() => handleRechazar(r)}
                            >
                              ❌ Rechazar
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
                          <tr key={r.id} className="border-t border-slate-100 hover:bg-blue-50/50 transition-colors">
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
                  {reservas.filter(r => r.estado === 'confirmada').length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-slate-400 text-sm py-8">No hay reservas confirmadas.</td>
                    </tr>
                  ) : (
                    reservas.filter(r => r.estado === 'confirmada').map((r) => (
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

      </main>

      <button className="fixed bottom-6 right-6 w-13 h-13 p-3.5 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 hover:scale-110 text-white text-xl font-bold shadow-lg shadow-blue-900/40 flex items-center justify-center transition-transform">
        ?
      </button>
    </div>
  );
}
