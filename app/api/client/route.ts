import {
  createClient,
  deleteClient,
  editClient,
  fetchClients,
  updateClientStage,
} from "@/app/actions/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await fetchClients();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      message: "Internal Server Error",
      status: 500,
    });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, stage } = await req.json();
    const data = await updateClientStage(id, stage);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      message: "Internal Server Error",
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await createClient(body);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      message: "Internal Server Error",
      status: 500,
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { clientId } = await req.json();

    const data = await deleteClient(clientId);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      message: "Internal Server Error",
      status: 500,
    });
  }
}

export async function PUT(req: Request) {
  try {
    const clientData = await req.json();

    // console.log(clientId);
    const data = await editClient(clientData);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      message: "Internal Server Error",
      status: 500,
    });
  }
}
