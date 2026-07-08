import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supaBase/supabaseClient";
import { User, Mail, Lock, KeyRound, AlertCircle } from "lucide-react";
import fondo from "./fondo-sign-up.jpg";
import sello from "../Inicio/sello-epn.png";

export default function SignUp() {
  const [rol, setRol] = useState("estudiante");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [claveEncargado, setClaveEncargado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;

  const validarNombre = (valor) => {
    return valor.trim().length >= 5 && soloLetrasRegex.test(valor);
  };

  const handleNombreChange = (e) => {
    const valor = e.target.value;

    if (!soloLetrasRegex.test(valor)) {
      return;
    }

    if (valor.length > 30) {
      return;
    }

    setNombre(valor);
  };

  const handleSubmit = async () => {
    if (!nombre || !correo || !contrasena || !confirmar) {
      setError("Por favor completa todos los campos.");
      return;
    }

    if (!validarNombre(nombre)) {
      setError("El nombre debe tener al menos 5 caracteres y solo puede contener letras.");
      return;
    }

    if (correo.length > 30) {
      setError("El correo no puede tener más de 30 caracteres.");
      return;
    }

    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (rol === "encargado" && claveEncargado !== "1234") {
      setError("Contraseña de encargado incorrecta.");
      return;
    }

    setError("");
    setCargando(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        data: {
          nombre: nombre,
          rol: rol,
        },
      },
    });

    setCargando(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setNombre("");
    setCorreo("");
    setContrasena("");
    setConfirmar("");
    setClaveEncargado("");

    if (rol === "encargado") {
      navigate("/encargado");
    } else {
      navigate("/estudiante");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Panel izquierdo con imagen y marca */}
      <div
        className="relative w-full md:w-1/2 min-h-[240px] md:min-h-screen bg-cover bg-center flex items-end"
        style={{ backgroundImage: `url(${fondo})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/50 to-blue-800/20"></div>
        <div className="relative z-10 p-8 md:p-12">
          <img src={sello} alt="Sello EPN" className="w-14 h-14 object-contain mb-4" />
          <h1 className="text-4xl font-bold text-white">Búho-Gear</h1>
          <p className="text-blue-100 mt-2">Reserva tu cancha, vive el deporte.</p>
        </div>
      </div>

      {/* Panel derecho con el formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            <button
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${
                rol === "estudiante"
                  ? "bg-blue-900 text-white shadow-md"
                  : "bg-white text-blue-900 border border-blue-900"
              }`}
              onClick={() => setRol("estudiante")}
            >
              Estudiante
            </button>
            <button
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition ${
                rol === "encargado"
                  ? "bg-blue-900 text-white shadow-md"
                  : "bg-white text-blue-900 border border-blue-900"
              }`}
              onClick={() => setRol("encargado")}
            >
              Encargado
            </button>
          </div>

          <h2 className="text-3xl font-bold text-blue-900">Crea tu cuenta</h2>
          <p className="text-gray-500 text-sm mt-2 mb-6">
            Crea tu cuenta, te llevará menos de un minuto.{" "}
            <Link to="/" className="text-blue-900 font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
                placeholder="Nombre completo"
                value={nombre}
                onChange={handleNombreChange}
                maxLength={30}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                maxLength={30}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
                placeholder="Confirmar contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>

            {rol === "encargado" && (
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 border border-amber-300 bg-amber-50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  placeholder="Contraseña para la creación de encargado"
                  value={claveEncargado}
                  onChange={(e) => setClaveEncargado(e.target.value)}
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
              onClick={handleSubmit}
              disabled={cargando}
            >
              {cargando && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              )}
              {cargando ? "Creando cuenta..." : "Registrarse"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}