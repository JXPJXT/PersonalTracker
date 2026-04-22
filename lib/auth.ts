"use server";

import { auth } from "@clerk/nextjs/server";

export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId;
}
