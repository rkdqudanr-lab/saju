import { logoutRequest } from "../lib/auth.js";

export default async function handler(req, res) {
  await logoutRequest(req, res);
  return res.status(200).json({ ok: true });
}
