# 🦉 Búho-Gear

**Sistema de gestión de reservas deportivas y préstamo de implementos — Escuela Politécnica Nacional**

Búho-Gear digitaliza el proceso de reserva de canchas y préstamo de implementos deportivos de la EPN. Reemplaza los formularios en papel y la dependencia de la atención presencial por una plataforma web donde los estudiantes consultan disponibilidad y reservan en tiempo real, y el personal encargado aprueba solicitudes, controla el inventario y genera reportes y comprobantes de forma automática.

Proyecto desarrollado para la materia **Gestión de Proyectos de Software (TDSD333)**, Escuela de Formación de Tecnólogos — EPN, bajo metodología ágil Scrum.

---

## Tabla de contenido

- [Funcionalidades principales](#funcionalidades-principales)
- [Roles del sistema](#roles-del-sistema)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Despliegue](#despliegue)
- [Autores](#autores)
- [Referencias](#referencias)

---

## Funcionalidades principales

- **Autenticación por roles** — inicio de sesión y registro diferenciado para Estudiante y Encargado.
- **Disponibilidad en tiempo real** — consulta de canchas, subcanchas y horarios libres u ocupados.
- **Reserva digital** — selección de cancha, subcancha y franja horaria, con solicitud opcional de implementos según la categoría deportiva.
- **Validación automática por OCR** — verificación del carnet estudiantil y la cédula mediante Tesseract.js antes de enviar la solicitud.
- **Aprobación y rechazo de reservas** — con actualización automática del stock de inventario en ambos casos.
- **Control de inventario** — alertas de stock bajo y trazabilidad de implementos por categoría deportiva.
- **Reportes y comprobantes** — reporte diario de reservas confirmadas y generación de comprobantes en PDF.

## Roles del sistema

| Rol | Descripción |
|---|---|
| **Estudiante** | Consulta la disponibilidad, reserva canchas, sube su carnet y cédula, y da seguimiento al estado de sus reservas. |
| **Encargado** | Aprueba o rechaza solicitudes, gestiona el inventario, controla los horarios y descarga reportes y comprobantes. |

## Stack tecnológico

| Categoría | Tecnología | Uso en el proyecto |
|---|---|---|
| Librería de UI | React 19 | Construcción de la interfaz basada en componentes. |
| Bundler / servidor de desarrollo | Vite | Empaquetado y recarga en caliente (HMR). |
| Enrutamiento | React Router DOM | Navegación entre Inicio, Registro, Estudiante y Encargado. |
| Estilos | Tailwind CSS | Maquetación y diseño visual de la aplicación. |
| Backend as a Service | Supabase (PostgreSQL, Auth, Storage, RPC) | Autenticación por roles, base de datos de reservas e inventario, almacenamiento de documentos y funciones para actualizar el stock. |
| Generación de documentos | jsPDF | Generación del comprobante de reserva en PDF. |
| Reconocimiento óptico de caracteres | Tesseract.js | Validación automática de las imágenes de carnet y cédula. |
| Iconografía | Lucide React | Íconos consistentes en toda la interfaz. |

> Este proyecto fue migrado de Create React App (CRA) a Vite para usar tecnología activamente mantenida, con tiempos de arranque y recarga significativamente más rápidos.

## Arquitectura

Búho-Gear sigue un patrón cliente-servidor: el cliente es una aplicación de una sola página (SPA) construida en React, y el servidor es reemplazado por Supabase en su modalidad de backend as a service. Cada vista (Inicio, Registro, Estudiante, Encargado) es un componente independiente que consume los servicios de Supabase —autenticación, base de datos y almacenamiento— a través de un cliente único, mientras que la validación OCR y la generación de PDF se ejecutan íntegramente en el navegador.

## Modelo de datos

| Entidad | Contenido |
|---|---|
| `usuarios` (Supabase Auth) | Correo, nombre y rol (`estudiante` / `encargado`) de cada usuario. |
| `reservas` | Cancha, categoría, fecha, horario, estado (`pendiente` / `confirmada` / `cancelada`), solicitud de implementos y referencias al carnet y la cédula. |
| `inventario` | Nombre, categoría, stock actual y stock mínimo de cada implemento. |
| `canchasDemo` (catálogo estático) | Canchas principales, subcanchas, ubicación, capacidad y categoría deportiva, definido en `data/canchasData.js`. |

## Requisitos previos

- Node.js 18 o superior
- npm
- Un proyecto de [Supabase](https://supabase.com) con las tablas `reservas` e `inventario`, y el bucket de Storage `comprobantes` ya creados

## Instalación

```bash
git clone <url-del-repositorio>
cd buho-gear
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```dotenv
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

> **Importante:** en Vite, todas las variables de entorno expuestas al frontend deben empezar con el prefijo `VITE_`. No subas el archivo `.env` al repositorio.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con recarga en caliente. Disponible en [http://localhost:3000](http://localhost:3000). |
| `npm run build` | Genera la build de producción optimizada en la carpeta `dist/`. |
| `npm run preview` | Sirve localmente la build de producción, útil para verificar antes de desplegar. |

## Estructura del proyecto

```
src/
├── Encargado/       Panel del encargado: reservas, inventario, horarios, reportes y comprobantes
├── Estudiante/      Panel del estudiante: canchas disponibles y mis reservas
├── Inicio/          Pantalla de inicio de sesión
├── sign-up/         Registro de usuarios (estudiante o encargado)
├── permisiones/     Modal de solicitud de reserva, carga y validación OCR de documentos
├── data/            Catálogo estático de canchas, subcanchas e implementos por categoría
├── supaBase/        Cliente y configuración de conexión a Supabase
└── index.jsx        Punto de entrada de la aplicación
```

## Despliegue

Al ejecutar `npm run build`, el contenido optimizado se genera en la carpeta `dist/`. Esa carpeta debe subirse al servicio de hosting elegido (Vercel, Netlify, GitHub Pages, entre otros), configurando allí también las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Autores

Proyecto desarrollado por **David Guato** y **Haziel Moncayo**, Escuela de Formación de Tecnólogos — Escuela Politécnica Nacional.

## Referencias

- [Documentación de React](https://react.dev)
- [Documentación de Vite](https://vite.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tesseract.js](https://github.com/naptha/tesseract.js)
- [Documentación de jsPDF](https://github.com/parallax/jsPDF)
