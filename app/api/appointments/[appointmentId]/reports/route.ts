export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ID, InputFile } from "node-appwrite";
import { databases, storage } from "@/lib/appwrite.config";
import {
  DATABASE_ID,
  APPOINTMENT_COLLECTION_ID,
  BUCKET_ID,
} from "@/lib/appwrite.config";
import type { Appointment } from "@/types/appwrite.types";

/**
 * POST — Upload a new report
 */
export async function POST(
  req: Request,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { appointmentId } = params;
    const form = await req.formData();

    const file = form.get("file") as File | null;
    const type = (form.get("type") as string) ?? "Other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Appwrite Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadedFile = await storage.createFile(
      BUCKET_ID!,
      ID.unique(),
      InputFile.fromBuffer(buffer, file.name)
    );

    // Create file URL
    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    // Get appointment doc
    const existing = (await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    )) as Appointment;

    const existingReports: any[] = Array.isArray(existing.reports)
      ? existing.reports.map((r) =>
          typeof r === "string" ? JSON.parse(r) : r
        )
      : [];

    const newReport = {
      url: fileUrl,
      type,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };

    const updatedReports = [...existingReports, newReport].map((r) =>
      JSON.stringify(r)
    );

    await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      { reports: updatedReports }
    );

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      reports: updatedReports.map((r) => JSON.parse(r)),
    });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

/**
 * PUT — Update reports (delete or modify)
 */
export async function PUT(
  req: Request,
  { params }: { params: { appointmentId: string } }
) {
  try {
    const { appointmentId } = params;
    const { reports } = await req.json();

    if (!Array.isArray(reports)) {
      return NextResponse.json(
        { error: "Reports must be an array" },
        { status: 400 }
      );
    }

    // Store as stringified array
    const stringifiedReports = reports.map((r) => JSON.stringify(r));

    await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      { reports: stringifiedReports }
    );

    revalidatePath("/admin");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT route error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
