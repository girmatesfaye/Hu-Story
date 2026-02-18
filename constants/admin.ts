import { supabase } from "../lib/supabase";

const isJwtExpired = (message?: string) =>
  Boolean(message && message.toLowerCase().includes("jwt expired"));

const requestIsAdmin = async () => {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    if (isJwtExpired(error.message)) {
      await supabase.auth.refreshSession();
      const retry = await supabase.rpc("is_admin");
      if (retry.error) return false;
      return Boolean(retry.data);
    }
    return false;
  }
  return Boolean(data);
};

export const isAdminUser = async () => requestIsAdmin();
