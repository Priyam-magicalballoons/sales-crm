"use server";

import { sqlClient } from "@/db/client";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const secret = process.env.JWT_SECRET!;

export async function createAccessToken(user: {
  userId: string;
  role?: string;
}) {
  return jwt.sign(user, secret, {
    expiresIn: "15m",
    algorithm: "HS256",
  });
}

export const verifyToken = async () => {
  const cookieStore = await cookies();

  // 1️⃣ Try access token first
  const accessToken = cookieStore.get("accessToken")?.value;

  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, secret) as {
        userId: string;
        role: string;
      };

      return { user: payload, status: 200 };
    } catch {
      // expired or invalid → continue to refresh
    }
  }

  // 2️⃣ Read refresh token
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return { status: 401, message: "Unauthenticated" };
  }

  // 3️⃣ SINGLE-FLIGHT REFRESH
  // Delete first → only ONE request can succeed
  const deleted = await sqlClient`
    DELETE FROM sessions
    WHERE id = ${refreshToken}
      AND expires_at > NOW()
    RETURNING user_id, role
  `;

  if (deleted.length === 0) {
    // Already used / expired / parallel refresh
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");

    return { status: 401, message: "Session expired" };
  }

  const { user_id: userId, role } = deleted[0];

  // 4️⃣ Issue new tokens
  const newRefreshToken = crypto.randomUUID();

  await sqlClient`
    INSERT INTO sessions (id, user_id, role, expires_at)
    VALUES (
      ${newRefreshToken},
      ${userId},
      ${role},
      ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)}
    )
  `;

  const newAccessToken = await createAccessToken({ userId, role });

  cookieStore.set("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // maxAge: 60,
  });

  cookieStore.set("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // maxAge: 10 * 60,
  });

  return { user: { userId, role }, status: 200 };
};
