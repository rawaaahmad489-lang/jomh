
import { supabase } from "../../services/supabaseClient";

export const authService = {

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  register: async ({ email, password, role, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, name },
      },
    });
    return { data, error };
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    return await supabase.auth.getUser();
  },
};