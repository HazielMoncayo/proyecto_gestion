import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supaBase/supabaseClient";
import { Mail, Lock, AlertCircle } from "lucide-react";
import fondo from "./fondo.avif";
import sello from "./sello-epn.png";

export default function Inicio() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError("");

        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email: correo,
            password: contrasena,
        });

        setCargando(false);

        if (loginError) {
            setError("Credenciales incorrectas.");
            return;
        }

        const rol = data.user.user_metadata?.rol;
        navigate(rol === "encargado" ? "/encargado" : "/estudiante");
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center p-4 relative"
            style={{ backgroundImage: `url(${fondo})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/60 to-blue-800/40"></div>

            <div className="relative z-10 w-full max-w-sm bg-white p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] animate-[fadeIn_0.4s_ease-out]">
                <div className="text-center mb-6">
                    <img
                        src={sello}
                        alt="Sello EPN"
                        className="mx-auto mb-3 w-16 h-16 object-contain"
                    />
                    <h1 className="text-3xl font-bold text-blue-900">Búho-Gear</h1>
                    <p className="text-gray-500 text-sm mt-2">Sistema Deportivo EPN</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Correo Institucional
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                                placeholder="usuario@epn.edu.ec"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                                placeholder="••••••••"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
                        disabled={cargando}
                    >
                        {cargando && (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        )}
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    ¿No tienes una cuenta?{" "}
                    <a href="/sign-up" className="text-blue-900 font-semibold hover:underline">
                        Regístrate aquí
                    </a>
                </p>
            </div>
        </div>
    );
}