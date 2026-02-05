"use server";

import { db, sqlClient } from "@/db/client";
import { client, users } from "@/db/schema";
import { verifyToken } from "@/lib/token";
import { User } from "@/types/crm";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { cache } from "react";

export const getAllUsers = cache(async () => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }
    const allUsers = await db.select().from(users);
    return {
      users: allUsers as User | any,
      status: 200,
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal Server Error",
    };
  }
});

export const updateUserProfile = async (
  name: string,
  email: string,
  id: string,
) => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }

    const update = await db
      .update(users)
      .set({ name, email })
      .where(eq(users.id, id));

    if (update.rowCount >= 0) {
      return {
        status: 200,
        message: "User Updated",
      };
    }
    return {
      status: 400,
      message: "Something went wrong",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};

export const changePassword = async (
  currPass: string,
  newPassword: string,
  userId: string,
) => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }

    const currentPassword = await db
      .select({ dbPass: users.password })
      .from(users)
      .where(eq(users.id, userId));

    if (currentPassword.length === 0) {
      return {
        status: 400,
        message: "user not found",
      };
    }

    const isPasswordMatching = bcrypt.compareSync(
      currPass,
      currentPassword[0].dbPass!,
    );

    if (!isPasswordMatching) {
      return {
        status: 400,
        message: "Incorrect Current password",
      };
    }
    const newHashedPassword = bcrypt.hashSync(newPassword);
    const updatePass = await db
      .update(users)
      .set({ password: newHashedPassword })
      .where(eq(users.id, userId));

    if (updatePass.rowCount <= 0) {
      return {
        status: 400,
        message: "Something went wrong",
      };
    }

    return {
      status: 200,
      message: "Password Updated Succesfully",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};

export const createUser = async (
  name: string,
  email: string,
  role: "ADMIN" | "USER" = "USER",
) => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }

    console.log(name, email);

    if (!name || !email) {
      return {
        status: 400,
        message: "Incomplete data provided",
      };
    }

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingEmail.length > 0) {
      return {
        status: 400,
        message: "Email Already Exists",
      };
    }

    const create = await db
      .insert(users)
      .values({
        email,
        name,
        role,
        password: bcrypt.hashSync(name),
        isActive: true,
      })
      .returning();

    if (create.length <= 0) {
      return {
        status: 400,
        message: "Something went wrong",
      };
    }

    return {
      status: 201,
      message: "User Created Successfully",
      user: create[0],
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};

export const changeUserStatus = async (userId: string) => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }

    if (!userId) {
      return {
        status: 400,
        message: "UserId not provided",
      };
    }

    const updateUser = await db
      .update(users)
      .set({ isActive: sql`NOT ${users.isActive}` })
      .where(eq(users.id, userId));

    if (updateUser.rowCount <= 0) {
      return {
        status: 400,
        message: "Something went wrong",
      };
    }

    return {
      status: 200,
      message: "User status updated successfully",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal Server Error",
    };
  }
};
