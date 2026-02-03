"use server";

import { db, sqlClient } from "@/db/client";
import { client } from "@/db/schema";
import { verifyToken } from "@/lib/token";
import { Client, Stage } from "@/types/crm";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";

interface CreateClientProps {
  name: string;
  stage: Stage;
  company: string;
  dealValue: number;
  email: string;
  notes: string;
  phone: string;
}

export const createClient = async ({
  company,
  dealValue = 0,
  email,
  name,
  notes,
  phone,
  stage = "lead",
}: CreateClientProps) => {
  const session = await verifyToken();

  if (session.status !== 200 || !session.user?.userId) {
    return session;
  }

  try {
    const create1 =
      await sqlClient`WITH user_data AS (select name,id FROM users WHERE id=${session.user.userId}) 
    INSERT INTO clients (
    name,
    company,
    deal_value,
    phone,
    stage,
    notes,
    email,
    user_id,
    creator_name
    ) SELECT 
     ${name},
     ${company},
     ${Number(dealValue)},
     ${phone},
     ${stage},
     ${notes},
     ${email},
     id,
     name
     FROM user_data RETURNING *
    `;

    // const create = await db.insert(client).values({
    //   name,
    //   company,
    //   deal_value: Number(dealValue),
    //   phone,
    //   stage,
    //   notes,
    //   email,
    //   userId: session?.user?.userId,
    // });
    if (create1.length <= 0) {
      return {
        status: 400,
        message: "Something went wrong",
      };
    }
    return {
      status: 200,
      message: "Client Added Successfully.",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};

export const fetchClients = async () => {
  const session = await verifyToken();
  if (session.status !== 200 || !session.user?.userId) {
    return session;
  }
  try {
    const clients = await db.select().from(client);

    const safeClients = Array.isArray(clients) ? clients : [];
    return {
      status: 200,
      data: safeClients,
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};

export const updateClientStage = async (id: string, stage: Stage) => {
  const session = await verifyToken();
  if (session.status !== 200 || !session.user?.userId) {
    return session;
  }

  try {
    const updateClient = await db.execute(sql`
    UPDATE clients SET stage = ${stage}, updated_at = ${new Date(Date.now())} WHERE id=${id}`);

    if (updateClient.rowCount <= 0) {
      return {
        status: 400,
        message: "Something Went Wrong",
      };
    }

    return {
      status: 200,
      message: "Client stage updated",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server Error",
    };
  }
};

export const deleteClient = async (clientId: string) => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }

    const deleteClient = await db.delete(client).where(eq(client.id, clientId));

    if (deleteClient.rowCount >= 1) {
      return {
        status: 200,
        message: "Client deleted successfully",
      };
    }
    return {
      status: 200,
      message: "Cannot delete client",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal server error",
    };
  }
};

export const editClient = async (clientData: Client) => {
  try {
    const session = await verifyToken();
    if (session.status !== 200 || !session.user?.userId) {
      return session;
    }

    const update = await db
      .update(client)
      .set({
        name: clientData.name,
        company: clientData.company,
        deal_value: clientData.deal_value,
        email: clientData.email,
        notes: clientData.notes,
        phone: clientData.phone,
      })
      .where(eq(client.id, clientData.id));

    if (update.rowCount <= 0) {
      return {
        status: 400,
        message: "Something went wrong",
      };
    }
    return {
      status: 200,
      message: "Client Updated",
    };
  } catch (error) {
    return {
      status: 500,
      message: "Internal Server Error",
    };
  }
};
