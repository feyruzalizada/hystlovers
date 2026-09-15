import type { Access } from "payload";

/** Anyone may read; only signed-in admins may write. */
export const adminOnly: Access = ({ req }) => Boolean(req.user?.collection === "users");

export const publicRead = () => true;

export const adminAccess = {
  read: publicRead,
  create: adminOnly,
  update: adminOnly,
  delete: adminOnly,
};
