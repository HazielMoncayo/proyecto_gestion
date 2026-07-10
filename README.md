# Gestión Buho Gear

Sistema de gestión de proyectos de software desarrollado como proyecto académico. Construido con **React + Vite**, **Tailwind CSS** y **Supabase** como backend.

## Stack tecnológico

- **React 19** — librería de UI
- **Vite** — bundler y servidor de desarrollo
- **React Router DOM** — enrutamiento de la aplicación
- **Tailwind CSS** — estilos
- **Supabase** — base de datos y autenticación
- **Lucide React** — iconografía

> Este proyecto fue migrado de Create React App (CRA) a Vite para usar tecnología activamente mantenida, con tiempos de arranque y recarga significativamente más rápidos.

## Requisitos previos

- Node.js 18 o superior
- npm

## Instalación

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```dotenv
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

> Importante: en Vite, todas las variables de entorno expuestas al frontend deben empezar con el prefijo `VITE_`.

## Scripts disponibles

En el directorio del proyecto puedes correr:

### `npm run dev`

Levanta el servidor de desarrollo con recarga en caliente (HMR).\
Abre [http://localhost:3000](http://localhost:3000) para verlo en el navegador.

### `npm run build`

Genera la build de producción optimizada en la carpeta `dist`.\
El código queda minificado y listo para desplegar.

### `npm run preview`

Sirve localmente la build de producción generada por `npm run build`, útil para verificar que todo funcione antes de desplegar.

## Estructura del proyecto

```
src/
├── Encargado/       # Módulo de encargado
├── Estudiante/       # Módulo de estudiante
├── Inicio/            # Página de inicio
├── permisiones/      # Manejo de permisos
├── sign-up/           # Registro de usuarios
├── supaBase/          # Cliente y configuración de Supabase
└── index.jsx           # Punto de entrada de la aplicación
```

## Despliegue

Al ejecutar `npm run build`, el contenido optimizado se genera en la carpeta `dist/`. Esa carpeta es la que debe subirse al servicio de hosting elegido (Vercel, Netlify, GitHub Pages, etc.).

## Aprender más

- [Documentación de Vite](https://vite.dev)
- [Documentación de React](https://react.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Supabase](https://supabase.com/docs)
