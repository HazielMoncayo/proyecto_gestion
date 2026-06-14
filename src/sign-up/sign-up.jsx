import React, { useState } from "react";
import "./sign-up.css";
import fondo from "./fondo-sign-up.jpg";
import { Link, useNavigate } from "react-router-dom";

export default function SignUp() {
  const [rol, setRol] = useState("estudiante");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [claveEncargado, setClaveEncargado] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!nombre || !correo || !contrasena || !confirmar) {
      setError("Por favor completa todos los campos.");
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

    setNombre("");
    setCorreo("");
    setContrasena("");
    setConfirmar("");
    setClaveEncargado("");
    setError("");

    if (rol === "encargado") {
      navigate("/encargado");
    } else {
      navigate("/estudiante");
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-left" style={{ backgroundImage: `url(${fondo})` }}>
        <div className="signup-left-overlay">
          <h1 className="signup-brand">Canchitas</h1>
          <p className="signup-frase">Reserva tu cancha, vive el deporte.</p>
        </div>
      </div>

      <div className="signup-right">
        <div className="signup-rol-wrapper">
          <button
            className={`signup-rol-btn ${rol === "estudiante" ? "activo" : ""}`}
            onClick={() => setRol("estudiante")}
          >
            Estudiante
          </button>
          <button
            className={`signup-rol-btn ${rol === "encargado" ? "activo" : ""}`}
            onClick={() => setRol("encargado")}
          >
            Encargado
          </button>
        </div>

        <h2 className="signup-titulo">Crea tu cuenta</h2>
        <p className="signup-subtitulo">
          Crea tu cuenta, te llevará menos de un minuto.{" "}
          <Link to="/" className="signup-link">Inicia sesión</Link>
        </p>

        <input
          type="text"
          className="signup-input"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="email"
          className="signup-input"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          type="password"
          className="signup-input"
          placeholder="Contraseña"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        <input
          type="password"
          className="signup-input"
          placeholder="Confirmar contraseña"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
        />

        {rol === "encargado" && (
          <input
            type="password"
            className="signup-input signup-input-gerente"
            placeholder="Contraseña para la creación de encargado"
            value={claveEncargado}
            onChange={(e) => setClaveEncargado(e.target.value)}
          />
        )}

        {error && <div className="signup-error">{error}</div>}

        <button className="signup-btn" onClick={handleSubmit}>
          Registrarse
        </button>
      </div>
    </div>
  );
}