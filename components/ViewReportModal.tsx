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

interface Props {
  appointment: Appointment;
}

export function ViewReportsModal({ appointment }: Props) {
  // handle reports (may be JSON string or array)
  const parsedReports =
    typeof appointment.reports === "string"
      ? JSON.parse(appointment.reports)
      : appointment.reports ?? [];

  const [reports, setReports] = useState(parsedReports);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!reports.length) return null;

  const handleDelete = async (index: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    try {
      setDeleting(reports[index].fileName || String(index));

      const updatedReports = [...reports];
      updatedReports.splice(index, 1);
      setReports(updatedReports);

      // Make API call to update in DB
      const res = await fetch(`/api/appointments/${appointment.$id}/reports`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reports: updatedReports }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Something went wrong while deleting the report.");
    } finally {
      setDeleting(null);
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
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Download
                  </a>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(i)}
                    disabled={deleting === (r.fileName || String(i))}
                  >
                    <Trash2
                      className={`h-4 w-4 ${
                        deleting === (r.fileName || String(i))
                          ? "text-gray-400 animate-pulse"
                          : "text-red-500"
                      }`}
                    />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
