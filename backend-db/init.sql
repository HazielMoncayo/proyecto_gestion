create schema api;

create role anon nologin;
create role authenticator noinherit login password '12052005';
grant anon to authenticator;

create type api.rol_usuario as enum ('estudiante', 'encargado');

create table api.usuarios (
  id serial primary key,
  nombre text not null,
  email text unique not null,
  password_hash text not null,
  rol api.rol_usuario not null,
  creado_en timestamptz default now()
);

create table api.estudiantes (
  usuario_id int primary key references api.usuarios(id) on delete cascade,
  grado text,
  seccion text,
  fecha_nacimiento date
);

create table api.encargados (
  usuario_id int primary key references api.usuarios(id) on delete cascade,
  telefono text,
  direccion text
);

create view api.usuarios_completo as
select
  u.id, u.nombre, u.email, u.rol, u.creado_en,
  e.grado, e.seccion, e.fecha_nacimiento,
  en.telefono, en.direccion
from api.usuarios u
left join api.estudiantes e on e.usuario_id = u.id
left join api.encargados en on en.usuario_id = u.id;

grant usage on schema api to anon;
grant select, insert, update, delete on all tables in schema api to anon;
grant usage, select on all sequences in schema api to anon;
grant select on api.usuarios_completo to anon;