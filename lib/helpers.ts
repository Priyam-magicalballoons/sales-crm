"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const accessToken = (await cookies()).get("accessToken");
  // TODO :- get access token from verifyToken();
  if (!accessToken) return;
  const decodedData = jwt.decode(accessToken?.value!) as {
    userId: string;
    role: "ADMIN" | "ROLE";
  };
  const userData = await db
    .select()
    .from(users)
    .where(eq(users.id, decodedData?.userId));

  return userData[0];
});

export const logout = async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  await db.delete(sessions).where(eq(sessions.id, refreshToken!));
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  return redirect("/login");
};
