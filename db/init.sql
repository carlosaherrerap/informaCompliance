CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tipo_documento (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS pais (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  continente VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS tipo_lista (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100),
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS entidades (
  id SERIAL PRIMARY KEY,
  id_tipo_documento INTEGER REFERENCES tipo_documento(id),
  id_pais INTEGER REFERENCES pais(id),
  documento VARCHAR(50),
  tipo_entidad VARCHAR(50), -- NATURAL o JURIDICA
  fecha_registro DATE DEFAULT CURRENT_DATE,
  departamento VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  direccion VARCHAR(200),
  tipo VARCHAR(50) CHECK (tipo IN ('publica', 'privada', 'individual', 'entidad', 'etc')), -- Clasificación específica
  rubro VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS personas_naturales (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  nombre VARCHAR(150),
  ape_pat VARCHAR(150),
  ape_mat VARCHAR(150),
  pasaporte VARCHAR(100),
  sexo CHAR(1) CHECK (sexo IN ('M','F'))
);

CREATE TABLE IF NOT EXISTS personas_juridicas (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  razon_social VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS historial_manchas (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  id_tipo_lista INTEGER REFERENCES tipo_lista(id),
  descripcion TEXT,
  link TEXT,
  fecha_registro DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS galeria (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  descripcion TEXT,
  src TEXT
);

CREATE TABLE IF NOT EXISTS extension_natural (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  fec_nac DATE,
  tez VARCHAR(50),
  estatura INTEGER,
  estado_civil VARCHAR(50),
  nacionalidad VARCHAR(100),
  grado_instruccion VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS extension_judicial (
  id SERIAL PRIMARY KEY,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE CASCADE,
  fec_creacion DATE,
  ubigeo VARCHAR(50),
  ip VARCHAR(50),
  web VARCHAR(150),
  origen VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombres VARCHAR(150),
  ape_pat VARCHAR(150),
  ape_mat VARCHAR(150),
  usuario VARCHAR(100) UNIQUE,
  clave VARCHAR(200),
  correo VARCHAR(150) UNIQUE,
  departamento VARCHAR(100),
  provincia VARCHAR(100),
  distrito VARCHAR(100),
  direccion VARCHAR(200),
  telefono VARCHAR(50),
  documento VARCHAR(50),
  cargo VARCHAR(100),
  empresa VARCHAR(150),
  photo TEXT
);

CREATE TABLE IF NOT EXISTS historial_consultas (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  id_entidad INTEGER REFERENCES entidades(id) ON DELETE SET NULL,
  fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tipo VARCHAR(50) CHECK (tipo IN ('masivo', 'unitario'))
);

CREATE TABLE IF NOT EXISTS rol (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(100),
  descripcion TEXT,
  state BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS base_programada (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  nombres VARCHAR(150),
  documento VARCHAR(50),
  cargo VARCHAR(100),
  rubros VARCHAR(150),
  tipo_entidad VARCHAR(100),
  fecha_creada DATE DEFAULT CURRENT_DATE,
  fecha_consulta DATE,
  entidad_hook VARCHAR(200),
  notify BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS notificaciones (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  id_base_programada INTEGER REFERENCES base_programada(id) ON DELETE SET NULL,
  id_entidades INTEGER REFERENCES entidades(id) ON DELETE SET NULL,
  fecha_enviado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS token (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  cant_actual INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens_consulta (
  id SERIAL PRIMARY KEY,
  id_usuarios INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  recarga INTEGER,
  fecha_gestion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membresia (
  id SERIAL PRIMARY KEY,
  descripcion VARCHAR(150),
  cantidad INTEGER
);

CREATE INDEX IF NOT EXISTS idx_entidades_documento ON entidades(documento);
CREATE INDEX IF NOT EXISTS idx_entidades_nombre ON personas_naturales(nombre);
CREATE INDEX IF NOT EXISTS idx_manchas_entidad ON historial_manchas(id_entidades);

-- NUEVAS TABLAS PARA REGISTRO DE OPERACIONES
CREATE TABLE IF NOT EXISTS registro_operaciones (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  -- SECCIÓN I
  empresa VARCHAR(200),
  numero_registro VARCHAR(100),
  oficina VARCHAR(200),
  fecha_registro DATE DEFAULT CURRENT_DATE,

  -- SECCIÓN II - PERSONA QUE FÍSICAMENTE REALIZA LA OPERACIÓN
  id_tipo_doc_fisica INTEGER REFERENCES tipo_documento(id),
  num_doc_fisica VARCHAR(50),
  nombres_fisica VARCHAR(200),
  apellidos_fisica VARCHAR(200),
  fec_nac_fisica DATE,
  nacionalidad_fisica VARCHAR(100),
  telefono_fisica VARCHAR(50),
  profesion_fisica VARCHAR(200),
  domicilio_fisica VARCHAR(250),
  cod_postal_fisica VARCHAR(50),
  departamento_fisica VARCHAR(100),
  provincia_fisica VARCHAR(100),
  distrito_fisica VARCHAR(100),

  -- SECCIÓN III - PERSONA EN CUYO NOMBRE SE REALIZA LA OPERACIÓN
  id_tipo_doc_nombre INTEGER REFERENCES tipo_documento(id),
  num_doc_nombre VARCHAR(50),
  nombres_nombre VARCHAR(200),
  apellidos_nombre VARCHAR(200),
  fec_nac_nombre DATE,
  nacionalidad_nombre VARCHAR(100),
  telefono_nombre VARCHAR(50),
  profesion_nombre VARCHAR(200),
  domicilio_nombre VARCHAR(250),
  cod_postal_nombre VARCHAR(50),
  departamento_nombre VARCHAR(100),
  provincia_nombre VARCHAR(100),
  distrito_nombre VARCHAR(100),

  -- SECCIÓN IV - DESCRIPCIÓN DE LA OPERACIÓN
  fec_operacion DATE,
  lugar_operacion VARCHAR(250),
  modalidad_pago VARCHAR(100),
  tipo_moneda VARCHAR(50),
  monto_operacion DECIMAL(15,2),
  tipo_operacion VARCHAR(100),
  nro_cuenta_1 VARCHAR(100),
  nro_cuenta_2 VARCHAR(100),
  nro_cuenta_3 VARCHAR(100),
  
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS beneficiarios_operacion (
  id SERIAL PRIMARY KEY,
  id_registro_operacion INTEGER REFERENCES registro_operaciones(id) ON DELETE CASCADE,
  numero_beneficiario VARCHAR(50),
  apellidos_razon_social VARCHAR(250),
  id_tipo_doc INTEGER REFERENCES tipo_documento(id),
  num_doc VARCHAR(50),
  fec_nac DATE
);

