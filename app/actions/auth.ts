"use server";

import { db, sqlClient } from "@/db/client";
import { createAccessToken } from "@/lib/token";
import bcryptjs from "bcryptjs";
import { cookies } from "next/headers";

export const login = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      return {
        status: 400,
        message: "Incomplete Data Provided",
      };
    }

    const user = await sqlClient`SELECT * FROM users WHERE email=${email}`;

    if (user.length === 0) {
      return {
        status: 401,
        message: "Unauthorized user",
      };
    }

    const passwordMatching = bcryptjs.compareSync(password, user[0].password);

    if (!passwordMatching) {
      return {
        status: 401,
        message: "Unauthorized user",
      };
    }
    const accessToken = await createAccessToken({
      userId: user[0].id,
      role: user[0].role,
    });

    const refreshToken = crypto.randomUUID();

    await sqlClient`
      INSERT INTO sessions 
      (
      id,
      user_id,
      role,
      expires_at
      )
      VALUES
      (
      ${refreshToken},
      ${user[0].id},
      ${user[0].role},
      ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)}
      ) 
      `;

    (await cookies()).set("accessToken", accessToken, {
      httpOnly: true,
      // secure: true,
      sameSite: "strict",
    });

    (await cookies()).set("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: true,
      sameSite: "strict",
    });

    return {
      status: 200,
      message: "Login Successfull",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal Server Error",
    };
  }
};

// export const logout = () => {
//   const userId =
// }
