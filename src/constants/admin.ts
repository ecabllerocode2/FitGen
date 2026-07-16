/** Must match backend domain/admin/constants.js */
export const ADMIN_UID = 'jSM4TdWES2bzdtbAom7Bl2Q0tEb2';

export function isAdminUser(uid: string | null | undefined): boolean {
  return uid === ADMIN_UID;
}
