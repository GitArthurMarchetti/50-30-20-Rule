import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signJwt(payload: object, expiresIn = "1h") {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyJwt<T = unknown>(token: string): Promise<T | null> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload as T;
    } catch {
      return null;
    }
  }
  