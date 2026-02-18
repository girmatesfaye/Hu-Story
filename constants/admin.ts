export const adminEmails = ["admin@example.com"];

export const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return adminEmails.includes(email.trim().toLowerCase());
};
