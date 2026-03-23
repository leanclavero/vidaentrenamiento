-- Supabase Schema para Coaching App

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: Usuarios
CREATE TABLE "Usuarios" (
    uid UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT NOT NULL,
    celular TEXT,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla: Ediciones
CREATE TABLE "Ediciones" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_grupo TEXT NOT NULL,
    id_coach UUID REFERENCES "Usuarios"(uid),
    id_coordinador UUID REFERENCES "Usuarios"(uid),
    fecha_inicio DATE,
    fecha_segundo_finde DATE,
    fecha_fin DATE,
    estado TEXT DEFAULT 'Seniors', -- "Seniors" o "Unificado"
    id_whatsapp_group TEXT,
    id_whatsapp_senior TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla: Inscripciones
CREATE TABLE "Inscripciones" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES "Usuarios"(uid) ON DELETE CASCADE,
    id_edicion UUID REFERENCES "Ediciones"(id) ON DELETE CASCADE,
    rol TEXT NOT NULL, -- 'Owner', 'Admin', 'Coach', 'Coordinador', 'Senior', 'Papisado', 'Participante'
    id_superior UUID REFERENCES "Usuarios"(uid), -- El Senior asignado o Papisado según etapa
    id_whatsapp_senior TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(id_usuario, id_edicion)
);

-- 4. Tabla: Asistencias
CREATE TABLE "Asistencias" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES "Usuarios"(uid) ON DELETE CASCADE,
    id_edicion UUID REFERENCES "Ediciones"(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT false,
    declaracion TEXT, -- 'presencial', 'virtual', 'ninguna'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla: Metas
CREATE TABLE "Metas" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario UUID REFERENCES "Usuarios"(uid) ON DELETE CASCADE,
    id_edicion UUID REFERENCES "Ediciones"(id) ON DELETE CASCADE,
    eje TEXT NOT NULL, -- 'Personal', 'Relaciones', 'Profesional', 'Comunitario', 'Finanzas', 'Enrolamiento'
    descripcion TEXT NOT NULL,
    estado TEXT DEFAULT 'Pendiente por Staff', -- 'Aprobada/Pendiente por Staff', 'al 100%'
    autorizar_metas_extra BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla: Declaraciones
CREATE TABLE "Declaraciones" (
    id_declaracion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_meta UUID REFERENCES "Metas"(id) ON DELETE CASCADE,
    semana_nro INTEGER NOT NULL,
    descripcion_compromiso TEXT NOT NULL,
    estado_validacion TEXT DEFAULT 'Pendiente', -- 'Aprobado', 'Rechazado'
    validado_por UUID REFERENCES "Usuarios"(uid),
    tipo_evidencia TEXT NOT NULL, -- 'única vez', 'múltiples veces'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabla: Evidencias
CREATE TABLE "Evidencias" (
    id_evidencia UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_declaracion UUID REFERENCES "Declaraciones"(id_declaracion) ON DELETE CASCADE,
    url_foto_evidencia TEXT,
    comentario_participante TEXT,
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado_validacion TEXT DEFAULT 'Pendiente', -- 'Aprobado', 'Rechazado'
    validado_por UUID REFERENCES "Usuarios"(uid)
);

-- RLS (Row Level Security) Básico: habilitamos acceso público temporalmente para simplificar desarrollo iterativo
ALTER TABLE "Usuarios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios logueados" ON "Usuarios" FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir crear a public" ON "Usuarios" FOR INSERT WITH CHECK (true);
