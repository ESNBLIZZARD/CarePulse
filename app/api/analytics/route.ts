import { NextRequest, NextResponse } from "next/server";
import { getAdminAnalytics } from "@/lib/actions/analytics.actions"; 

export async function GET(req: NextRequest) {
  try {
    const doctor = req.nextUrl.searchParams.get("doctor") || undefined;
    const data = await getAdminAnalytics(doctor);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
