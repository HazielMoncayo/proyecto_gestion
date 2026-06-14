import React, { useState } from "react";
import "./inicio.css";
import fondo from "./fondo.avif";

export default function Inicio() {
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");

    const usuariosEjemplo = [
        { correo: "admin@universidad.edu", contrasena: "admin123" },
        { correo: "usuario@universidad.edu", contrasena: "usuario123" },
    ];

    const handleSubmit = () => {
        const encontrado = usuariosEjemplo.find(
            (u) => u.correo === correo && u.contrasena === contrasena
        );

        if (encontrado) {
            setError("");
            alert("Sesión iniciada correctamente");
        } else {
            setError("Credenciales incorrectas. Intenta con alguno de los usuarios de ejemplo.");
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

                    <button className="inicio-btn" onClick={handleSubmit}>
                        Iniciar Sesión
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