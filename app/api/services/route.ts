import { NextResponse } from "next/server";
import { fetchServices } from "@/lib/bookings";

export async function GET() {
  try {
    const services = await fetchServices(true);
    return NextResponse.json({ services });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load services";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
