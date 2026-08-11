-- ============================================
-- POLÍTICAS RLS PARA ETALUM ZFS
-- Si DISABLE no funciona, usar estas políticas
-- Copiar y pegar en Supabase SQL Editor
-- ============================================

-- Vehiculos
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on vehiculos" ON vehiculos FOR ALL USING (true) WITH CHECK (true);

-- Conductores
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on conductores" ON conductores FOR ALL USING (true) WITH CHECK (true);

-- Clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);

-- Obras
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on obras" ON obras FOR ALL USING (true) WITH CHECK (true);

-- Rutas
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on rutas" ON rutas FOR ALL USING (true) WITH CHECK (true);

-- Despachos
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on despachos" ON despachos FOR ALL USING (true) WITH CHECK (true);

-- Viajes
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on viajes" ON viajes FOR ALL USING (true) WITH CHECK (true);

-- Combustible
ALTER TABLE combustible ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on combustible" ON combustible FOR ALL USING (true) WITH CHECK (true);

-- Peajes
ALTER TABLE peajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on peajes" ON peajes FOR ALL USING (true) WITH CHECK (true);

-- Indicadores
ALTER TABLE indicadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on indicadores" ON indicadores FOR ALL USING (true) WITH CHECK (true);

-- Log eventos
ALTER TABLE log_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on log_eventos" ON log_eventos FOR ALL USING (true) WITH CHECK (true);

-- Usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);

-- Parametros
ALTER TABLE parametros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on parametros" ON parametros FOR ALL USING (true) WITH CHECK (true);
