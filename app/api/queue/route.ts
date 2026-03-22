import { NextResponse } from "next/server";
import { computeQueueSummary } from "@/lib/bookings";
import { getShopSettings } from "@/lib/settings";

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [summary, settings] = await Promise.all([
      computeQueueSummary(today),
      getShopSettings(),
    ]);

    return NextResponse.json({
      ...summary,
      shopSettings: settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load queue";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
