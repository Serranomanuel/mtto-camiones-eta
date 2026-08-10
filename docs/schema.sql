-- ============================================
-- ETALUM ZFS - Schema de Base de Datos
-- Copiar y pegar en Supabase SQL Editor
-- ============================================

-- 1. TABLA VEHICULOS
CREATE TABLE IF NOT EXISTS vehiculos (
  id TEXT PRIMARY KEY,
  placa TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  año INTEGER NOT NULL,
  tipo_vehiculo TEXT NOT NULL,
  capacidad_carga_kg NUMERIC NOT NULL,
  ciudad_base TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activo',
  km_actual NUMERIC DEFAULT 0,
  rendimiento_km_gal NUMERIC NOT NULL,
  soat_vencimiento DATE NOT NULL,
  tecnomecanica_vencimiento DATE NOT NULL,
  proximo_mantenimiento_km NUMERIC DEFAULT 0,
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA CONDUCTORES
CREATE TABLE IF NOT EXISTS conductores (
  id TEXT PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  cedula TEXT NOT NULL UNIQUE,
  categoria_licencia TEXT NOT NULL,
  licencia_vencimiento DATE NOT NULL,
  telefono TEXT NOT NULL,
  ciudad_base TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Activo',
  vehiculo_asignado_id TEXT,
  placa_asignada TEXT,
  fecha_ingreso DATE NOT NULL,
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLA CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  nit TEXT NOT NULL UNIQUE,
  contacto TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  email TEXT DEFAULT '',
  ciudad TEXT NOT NULL,
  obras_activas INTEGER DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Activa',
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. TABLA OBRAS
CREATE TABLE IF NOT EXISTS obras (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  torre TEXT DEFAULT '',
  cliente_id TEXT,
  ciudad TEXT NOT NULL,
  direccion TEXT NOT NULL,
  estado_direccion TEXT DEFAULT 'Completo',
  estado_obra TEXT DEFAULT 'Activa',
  fuente TEXT DEFAULT '',
  alias TEXT DEFAULT '',
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. TABLA RUTAS
CREATE TABLE IF NOT EXISTS rutas (
  id TEXT PRIMARY KEY,
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  via TEXT DEFAULT '',
  distancia_km NUMERIC,
  tiempo_min NUMERIC,
  peaje_referencia NUMERIC,
  link_google_maps TEXT DEFAULT '',
  ultima_actualizacion DATE,
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. TABLA VIAJES
CREATE TABLE IF NOT EXISTS viajes (
  id TEXT PRIMARY KEY,
  fecha DATE NOT NULL,
  ruta_id TEXT,
  ciudad_destino TEXT NOT NULL,
  vehiculo_id TEXT,
  placa TEXT NOT NULL,
  conductor_id TEXT,
  conductor_nombre TEXT NOT NULL,
  despachos_incluidos TEXT DEFAULT '',
  numero_obras_incluidas INTEGER DEFAULT 0,
  hora_salida TIME,
  km_inicial NUMERIC DEFAULT 0,
  km_final NUMERIC DEFAULT 0,
  km_recorridos NUMERIC DEFAULT 0,
  costo_peajes NUMERIC DEFAULT 0,
  consumo_galones NUMERIC DEFAULT 0,
  costo_combustible NUMERIC DEFAULT 0,
  costo_total NUMERIC DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Programado',
  observaciones TEXT DEFAULT '',
  cliente TEXT DEFAULT '',
  direccion_origen TEXT DEFAULT '',
  direccion_destino TEXT DEFAULT '',
  hora_llegada TIME,
  cantidad_peajes INTEGER DEFAULT 0,
  tiempo_recorrido_min INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. TABLA DESPACHOS
CREATE TABLE IF NOT EXISTS despachos (
  id TEXT PRIMARY KEY,
  fecha DATE NOT NULL,
  dia TEXT NOT NULL,
  obra_id TEXT,
  nombre_obra TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  cliente_id TEXT,
  descripcion_carga TEXT NOT NULL,
  area_responsable TEXT NOT NULL,
  memo TEXT DEFAULT '',
  cot TEXT DEFAULT '',
  responsable_autoriza TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'Programado',
  viaje_asignado_id TEXT,
  observaciones TEXT DEFAULT '',
  registrado_por TEXT DEFAULT '',
  fecha_registro TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. TABLA PEAJES
CREATE TABLE IF NOT EXISTS peajes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  via TEXT NOT NULL,
  departamento TEXT NOT NULL,
  categoria_vehiculo TEXT NOT NULL,
  tarifa NUMERIC NOT NULL,
  fecha_actualizacion DATE,
  fuente TEXT DEFAULT '',
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. TABLA COMBUSTIBLE
CREATE TABLE IF NOT EXISTS combustible (
  id TEXT PRIMARY KEY,
  fecha DATE NOT NULL,
  ciudad TEXT NOT NULL,
  tipo TEXT NOT NULL,
  precio_galon NUMERIC NOT NULL,
  fuente TEXT DEFAULT '',
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. TABLA USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'Visual',
  estado TEXT NOT NULL DEFAULT 'Activo',
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  ultimo_acceso DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. TABLA LOG AUDITORIA
CREATE TABLE IF NOT EXISTS log_auditoria (
  id BIGSERIAL PRIMARY KEY,
  fecha_hora TIMESTAMP DEFAULT NOW(),
  usuario TEXT NOT NULL,
  modulo TEXT NOT NULL,
  accion TEXT NOT NULL,
  id_registro TEXT,
  campo_modificado TEXT DEFAULT '',
  valor_anterior TEXT DEFAULT '',
  valor_nuevo TEXT DEFAULT '',
  detalle TEXT DEFAULT ''
);

-- 12. TABLA INDICADORES
CREATE TABLE IF NOT EXISTS indicadores (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  periodo TEXT NOT NULL,
  valor_actual NUMERIC DEFAULT 0,
  meta TEXT DEFAULT '',
  unidad TEXT DEFAULT '',
  tendencia TEXT DEFAULT 'stable',
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. TABLA PARAMETROS
CREATE TABLE IF NOT EXISTS parametros (
  parametro TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT DEFAULT ''
);

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Vehiculos
INSERT INTO vehiculos (id, placa, marca, modelo, año, tipo_vehiculo, capacidad_carga_kg, ciudad_base, estado, km_actual, rendimiento_km_gal, soat_vencimiento, tecnomecanica_vencimiento, proximo_mantenimiento_km)
VALUES
  ('VEH-01', 'ABC123', 'Chevrolet', 'NHR', 2022, 'Camión turbo', 3500, 'Bogotá', 'Activo', 45000, 8.5, '2026-12-15', '2026-11-20', 50000),
  ('VEH-02', 'DEF456', 'Renault', 'Kangoo', 2021, 'Camioneta', 1200, 'Barranquilla', 'Activo', 32000, 10.2, '2026-09-10', '2026-08-25', 35000),
  ('VEH-03', 'GHI789', 'Volvo', 'FH16', 2023, 'Tractomula', 25000, 'Cartagena', 'Activo', 18000, 4.8, '2027-03-01', '2027-02-15', 20000),
  ('VEH-04', 'JKL012', 'Mercedes', 'Sprinter', 2020, 'Furgón', 4500, 'Santa Marta', 'En taller', 67000, 7.1, '2026-06-20', '2026-05-30', 70000),
  ('VEH-05', 'MNO345', 'Ford', 'Ranger', 2022, 'Camioneta', 1500, 'Bucaramanga', 'Activo', 28000, 9.8, '2026-11-01', '2026-10-15', 30000)
ON CONFLICT (id) DO NOTHING;

-- Conductores
INSERT INTO conductores (id, nombre_completo, cedula, categoria_licencia, licencia_vencimiento, telefono, ciudad_base, estado, vehiculo_asignado_id, placa_asignada, fecha_ingreso)
VALUES
  ('CON-01', 'Carlos Mendoza', '1020304050', 'C3', '2027-05-15', '3101234567', 'Bogotá', 'Activo', 'VEH-01', 'ABC123', '2022-01-15'),
  ('CON-02', 'Laura García', '1020304051', 'B2', '2027-08-20', '3107654321', 'Barranquilla', 'Activo', 'VEH-02', 'DEF456', '2023-03-20'),
  ('CON-03', 'Pedro Ramírez', '1020304052', 'C3', '2026-12-01', '3159876543', 'Cartagena', 'Activo', 'VEH-03', 'GHI789', '2021-06-10'),
  ('CON-04', 'Ana López', '1020304053', 'B2', '2026-06-30', '3161234567', 'Santa Marta', 'Inactivo', NULL, NULL, '2023-08-01')
ON CONFLICT (id) DO NOTHING;

-- Clientes
INSERT INTO clientes (id, nombre, nit, contacto, telefono, email, ciudad, obras_activas, estado)
VALUES
  ('CLI-01', 'Constructora ABC', '900123456-7', 'Juan Pérez', '6012345678', 'contacto@constructoraabc.com', 'Bogotá', 5, 'Activa'),
  ('CLI-02', 'Inmobiliaria XYZ', '900765432-1', 'María López', '6018765432', 'info@xyz.com', 'Barranquilla', 3, 'Activa'),
  ('CLI-03', 'Edificios del Norte', '900111222-3', 'Pedro Sánchez', '6015554444', 'ventas@ednorte.com', 'Cartagena', 2, 'Activa')
ON CONFLICT (id) DO NOTHING;

-- Obras
INSERT INTO obras (id, nombre, torre, cliente_id, ciudad, direccion, estado_direccion, estado_obra)
VALUES
  ('OBR-01', 'Torre Residencial El Parque', 'A', 'CLI-01', 'Bogotá', 'Calle 80 #15-20', 'Completo', 'Activa'),
  ('OBR-02', 'Centro Comercial Plaza Mayor', '', 'CLI-01', 'Bogotá', 'Carrera 7 #72-41', 'Completo', 'Activa'),
  ('OBR-03', 'Conjunto Habitacional Norte', 'B', 'CLI-02', 'Barranquilla', 'Carrera 45 #68-12', 'Completo', 'Activa'),
  ('OBR-04', 'Torre Empresarial Cartagena', '', 'CLI-03', 'Cartagena', 'Av. Venezuela #6-20', 'Falta dirección', 'Activa')
ON CONFLICT (id) DO NOTHING;

-- Rutas
INSERT INTO rutas (id, origen, destino, via, distancia_km, tiempo_min, peaje_referencia, link_google_maps, ultima_actualizacion)
VALUES
  ('RUT-01', 'Bogotá', 'Barranquilla', 'Ruta Norte', 1050, 720, 45000, 'https://maps.google.com', '2026-01-01'),
  ('RUT-02', 'Bogotá', 'Cartagena', 'Ruta Norte', 1100, 780, 52000, 'https://maps.google.com', '2026-01-01'),
  ('RUT-03', 'Bogotá', 'Santa Marta', 'Ruta Norte', 980, 660, 38000, 'https://maps.google.com', '2026-01-01'),
  ('RUT-04', 'Bogotá', 'Bucaramanga', 'Ruta Oriente', 400, 300, 22000, 'https://maps.google.com', '2026-01-01')
ON CONFLICT (id) DO NOTHING;

-- Combustible
INSERT INTO combustible (id, fecha, ciudad, tipo, precio_galon, fuente)
VALUES
  ('COM-01', '2026-08-01', 'Bogotá', 'Diésel', 14250, 'MinCIT'),
  ('COM-02', '2026-08-01', 'Barranquilla', 'Diésel', 13800, 'MinCIT'),
  ('COM-03', '2026-08-01', 'Cartagena', 'Diésel', 14100, 'MinCIT'),
  ('COM-04', '2026-08-01', 'Santa Marta', 'Diésel', 13950, 'MinCIT'),
  ('COM-05', '2026-08-01', 'Bucaramanga', 'Diésel', 14000, 'MinCIT')
ON CONFLICT (id) DO NOTHING;

-- Peajes
INSERT INTO peajes (id, nombre, via, departamento, categoria_vehiculo, tarifa, fecha_actualizacion, fuente)
VALUES
  ('PEA-01', 'Peaje Chicoral', 'Ruta Norte', 'Cundinamarca', 'Categoría III', 18500, '2026-01-01', 'INVÍAS'),
  ('PEA-02', 'Peaje Boyacá', 'Ruta Norte', 'Boyacá', 'Categoría III', 22000, '2026-01-01', 'INVÍAS'),
  ('PEA-03', 'Peaje Cañaveral', 'Ruta Norte', 'Santander', 'Categoría III', 19500, '2026-01-01', 'INVÍAS')
ON CONFLICT (id) DO NOTHING;

-- Parametros
INSERT INTO parametros (parametro, valor, descripcion)
VALUES
  ('Moneda', 'COP', 'Moneda del sistema'),
  ('Año vigente', '2026', 'Año fiscal en curso'),
  ('Nombre empresa', 'ETALUM S.A.S.', 'Nombre comercial de la empresa'),
  ('Precio combustible referencia', '14250', 'Precio de referencia del galón de diésel en COP')
ON CONFLICT (parametro) DO NOTHING;
