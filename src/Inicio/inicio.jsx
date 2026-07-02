import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./inicio.css";
import fondo from "./fondo.avif";

export default function Inicio() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!correo || !contrasena) {
            setError("Por favor completa todos los campos.");
            return;
        }

        setCargando(true);
        setError("");

        try {
            const res = await fetch("http://localhost:3000/rpc/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correo, password: contrasena }),
            });

            if (!res.ok) {
                setError("Credenciales incorrectas.");
                setCargando(false);
                return;
            }

            const usuario = await res.json();

            // Guardamos el usuario logueado para usarlo en otras pantallas
            localStorage.setItem("usuario", JSON.stringify(usuario));

            if (usuario.rol === "encargado") {
                navigate("/encargado");
            } else {
                navigate("/estudiante");
            }
        } catch (err) {
            setError("No se pudo conectar con el servidor.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="inicio-bg" style={{ '--fondo': `url(${fondo})` }}>
            <div className="inicio-overlay">
                <div className="inicio-header">
                    <div className="inicio-logo">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <polyline
                                points="2,14 8,6 14,20 20,10 26,14"
                                stroke="#6C63FF"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </svg>
                        <span className="inicio-titulo">Canchitas</span>
                    </div>
                    <p className="inicio-subtitulo">Sistema de Gestión de Canchas Deportivas</p>
                </div>

                <div className="inicio-card">
                    <h2 className="inicio-card-titulo">Iniciar Sesión</h2>

                    <div className="inicio-campo">
                        <label className="inicio-label">Correo Electrónico</label>
                        <div className="inicio-input-wrapper">
                            <span className="inicio-icono">✉</span>
                            <input
                                type="email"
                                className="inicio-input"
                                placeholder="usuario@universidad.edu"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="inicio-campo">
                        <label className="inicio-label">Contraseña</label>
                        <div className="inicio-input-wrapper">
                            <span className="inicio-icono">🔒</span>
                            <input
                                type="password"
                                className="inicio-input"
                                placeholder="••••••••"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="inicio-error">
                            {error}
                        </div>
                    )}

                    <button className="inicio-btn" onClick={handleSubmit} disabled={cargando}>
                        {cargando ? "Ingresando..." : "Iniciar Sesión"}
                    </button>
                    <p className="inicio-registro">
                        ¿No tienes una cuenta?{" "}
                        <a href="/sign-up" className="inicio-link">Regístrate aquí</a>
                    </p>
                </div>
            </div>
        </div>
    );
}