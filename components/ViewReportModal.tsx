"use client";

import React, { useState } from "react";
import { Appointment } from "@/types/appwrite.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
// import { toast } from "sonner"; // if you use sonner or replace with your toast library

interface Props {
  appointment: Appointment;
  isAdmin?: boolean;
}

export function ViewReportsModal({ appointment, isAdmin }: Props) {
  // Safely parse reports (avoid crashing on "Empty" or invalid JSON)
  const parsedReports = (() => {
    if (!appointment.reports) return [];
    if (typeof appointment.reports === "string") {
      try {
        const parsed = JSON.parse(appointment.reports);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(appointment.reports) ? appointment.reports : [];
  })();

  const [reports, setReports] = useState(parsedReports);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!reports.length) return null;

  // Handle file deletion
  const handleDelete = async (index: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    try {
      setDeleting(reports[index].fileName || String(index));

      const updatedReports = [...reports];
      updatedReports.splice(index, 1);
      setReports(updatedReports);

      const res = await fetch(`/api/appointments/${appointment.$id}/reports`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: updatedReports }),
      });

      if (!res.ok) throw new Error("Failed to delete report");

      console.log("Report deleted successfully ✅");
    } catch (error) {
      console.error("Error deleting report:", error);
      console.error("Something went wrong while deleting the report.");
    } finally {
      setDeleting(null);
    }
  };

  //  Handle download
  const handleDownload = async (report: any) => {
    try {
      const reportData = typeof report === "string" ? JSON.parse(report) : report;

      if (!reportData?.url && !reportData?.fileId) {
        console.error("No valid file reference found for this report.");
        return;
      }

      let viewUrl = reportData.url;
      if (viewUrl?.includes("/view")) {
        // already a view link, keep as is
      } else if (reportData.fileId) {
        // create a view URL instead of download
        viewUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_BUCKET_ID}/files/${reportData.fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      }

      if (!viewUrl) {
        console.error("No valid file URL found.");
        return;
      }

      //  Open file in a new browser tab
      window.open(viewUrl, "_blank");
      console.log("Opened file in a new tab!");
    } catch (error) {
      console.error("Error opening file:", error);
      console.error("Failed to open file in new tab.");
    }
  };


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-blue-400">
          View Reports
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Reports — {appointment.patient?.name ?? "Patient"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ul className="space-y-3">
            {reports.map((r: any, i: number) => (
              <li
                key={i}
                className="flex justify-between items-center border p-3 rounded"
              >
                <div>
                  <div className="font-medium">{r.type ?? "Report"}</div>
                  <div className="text-sm text-gray-400">{r.fileName ?? "file"}</div>
                  <div className="text-xs text-gray-500">
                    {r.uploadedAt
                      ? new Date(r.uploadedAt).toLocaleString()
                      : ""}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleDownload(r)}
                  >
                    Download
                  </Button>
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(i)}
                      disabled={deleting === (r.fileName || String(i))}
                    >
                      <Trash2
                        className={`h-4 w-4 ${deleting === (r.fileName || String(i))
                            ? "text-gray-400 animate-pulse"
                            : "text-red-500"
                          }`}
                      />
                    </Button>
                  )}

                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
