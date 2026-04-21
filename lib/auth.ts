"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "studytrack_session";
const SESSION_VALUE = "authenticated";
// Session lasts 7 days
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (username === validUsername && password === validPassword) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure: false, // local dev
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return { success: true };
  }

  return { success: false, error: "Invalid username or password" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === SESSION_VALUE;
}
