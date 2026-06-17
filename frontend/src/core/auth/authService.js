/// src/core/auth/authService.js

import { supabase } from "../../services/supabaseClient";

export const authService = {
  // 🔐 LOGIN
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("LOGIN ERROR:", error);
    }

    return { data, error };
  },

  // 🆕 REGISTER
 /* register: async ({ email, password, role, name, specialty, license }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name,
           specialty: specialty || null,
          license:   license   || null,
        },
      },
    });

    if (error) {
      console.error("SIGNUP ERROR:", error);
      return { data: null, error };
    }

    console.log("SIGNUP SUCCESS:", data);

    return { data, error: null };
  },*/
register: async ({ email, password, role, name, specialty, license_number, certifications }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        name,
        specialty:      specialty      || null,
        license_number: license_number || null,
        certifications: certifications || null,
      },
    },
  });
  if (error) { console.error("SIGNUP ERROR:", error); return { data: null, error }; }
  return { data, error: null };
},
  // 🚪 LOGOUT
  logout: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("LOGOUT ERROR:", error);
    }

    return { error };
  },

  // 👤 GET AUTH USER
  getUser: async () => {
    return await supabase.auth.getUser();
  },

  // 🔑 FORGOT PASSWORD
forgotPassword: async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });
  if (error) console.error("FORGOT PASSWORD ERROR:", error);
  return { data, error };
},

// 🔄 RESET PASSWORD
resetPassword: async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) console.error("RESET PASSWORD ERROR:", error);
  return { data, error };
},
};
