import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const roleHierarchy = {
    'Owner': 0,
    'Admin': 1,
    'Coach': 2,
    'Coordinador': 3,
    'Senior': 4,
    'Papisado': 5,
    'Participante': 6
  };

  const fetchProfile = async (userId) => {
    try {
      // 1. Fetch base profile from Usuarios
      const { data: userData, error: userError } = await supabase
        .from('Usuarios')
        .select('*')
        .eq('uid', userId)
        .single();
        
      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching profile:', userError);
      }
      
      let finalProfile = userData || { uid: userId };

      // 2. Hardcoded overrides for system owners/admins
      const { data: authResp } = await supabase.auth.getUser();
      const email = authResp?.user?.email;
      if (email === 'plclavero@gmail.com') {
         finalProfile.rol_global = 'Owner';
      } else if (email === 'vidaccion@live.com.ar') {
         finalProfile.rol_global = 'Admin';
      }

      // 3. Fetch edition roles from Inscripciones to determine effective role
      const { data: inscripciones, error: inscError } = await supabase
        .from('Inscripciones')
        .select('rol')
        .eq('id_usuario', userId);

      if (!inscError && inscripciones && inscripciones.length > 0) {
        // Find the highest role (lowest numerical value in hierarchy)
        let bestRole = 'Participante';
        let bestRank = 99;

        inscripciones.forEach(ins => {
          if (!ins.rol) return;
          // Normalize to Title Case for hierarchy lookup
          const roleKey = ins.rol.charAt(0).toUpperCase() + ins.rol.slice(1).toLowerCase();
          const rank = roleHierarchy[roleKey] ?? 99;
          if (rank < bestRank) {
            bestRank = rank;
            bestRole = roleKey;
          }
        });

        // Current role normalization
        const currentRaw = finalProfile.rol_global || 'Participante';
        const currentNormalized = currentRaw.charAt(0).toUpperCase() + currentRaw.slice(1).toLowerCase();
        const currentRank = roleHierarchy[currentNormalized] ?? 99;

        if (bestRank < currentRank) {
          finalProfile.rol_global = bestRole;
        } else {
          finalProfile.rol_global = currentNormalized;
        }
      }

      // 4. Normalize role to Title Case for UI consistency
      if (finalProfile.rol_global) {
        finalProfile.rol_global = finalProfile.rol_global.charAt(0).toUpperCase() + 
                                  finalProfile.rol_global.slice(1).toLowerCase();
      } else {
        finalProfile.rol_global = 'Participante';
      }
      
      setProfile(finalProfile);
    } catch (err) {
      console.error('Error in fetchProfile:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    if (user) fetchProfile(user.id);
  };

  const loginWithEmail = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const registerWithEmail = async (email, password, metadata) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  };

  const loginWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  const logout = async () => {
    return supabase.auth.signOut();
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('Usuarios')
        .update(updates)
        .eq('uid', user.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(prev => ({ ...prev, ...data }));
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const value = {
    user,
    profile,
    loading,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
