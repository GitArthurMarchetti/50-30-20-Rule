import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ message: "logout" });

  res.cookies.set({
    name: "sessionToken",
    value: "",
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}
