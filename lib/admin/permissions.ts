export type AdminRole = "SUPER_ADMIN" | "EDITOR" | "READ_ONLY";
export type Permission = "content.view" | "content.edit" | "content.preview" | "content.publish" | "content.delete" |
  "media.upload" | "media.delete" | "users.manage" | "settings.manage" | "flags.manage" | "redirects.manage" | "audit.view";
const matrix: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: ["content.view","content.edit","content.preview","content.publish","content.delete","media.upload","media.delete","users.manage","settings.manage","flags.manage","redirects.manage","audit.view"],
  EDITOR: ["content.view","content.edit","content.preview","media.upload"],
  READ_ONLY: ["content.view"],
};
export function can(role:AdminRole,permission:Permission):boolean {return matrix[role]?.includes(permission)??false;}
