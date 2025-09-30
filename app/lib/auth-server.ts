import { cookies } from "next/headers";
import { verifyJwt } from "./jwt";


export interface SessionUser {
  userId: number;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("sessionToken")?.value;
  if (!token) return null;

  const payload = await verifyJwt<{ userId: number; email: string }>(token);
  if (!payload) return null;

  return { userId: payload.userId, email: payload.email };
}
