-- Script para sincronizar usuarios de Supabase Auth con la tabla pública 'Usuarios'

-- 1. Insertar todos los usuarios actuales de auth.users que no estén en public.Usuarios
INSERT INTO public."Usuarios" (uid, email, nombre, apellido)
SELECT 
    id, 
    email, 
    -- Si el raw_user_meta_data tiene nombre y apellido (ej. de Google o signUp config), lo usamos, sino el email
    COALESCE(raw_user_meta_data->>'nombre', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'apellido', 'Usuario')
FROM auth.users
WHERE id NOT IN (SELECT uid FROM public."Usuarios");

-- 2. Crear o reemplazar la función del trigger para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."Usuarios" (uid, email, nombre, apellido)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)), 
    COALESCE(new.raw_user_meta_data->>'apellido', 'Usuario')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el trigger para que se ejecute en cada registro nuevo de Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
