"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UploadReportModalProps {
  appointmentId: string;
  onUploaded?: () => void;
}

export function UploadReportModal({ appointmentId, onUploaded }: UploadReportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file.");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);

      const res = await fetch(`/api/appointments/${appointmentId}/reports`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      onUploaded?.();
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Upload Report
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {/* <option value="Lab Report">Lab Report</option>
            <option value="Prescription">Prescription</option>
            <option value="X-Ray">X-Ray</option>
            <option value="Scan">Scan</option>
            <option value="Other">Other</option> */}
          </input>

          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full"
          />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => (window as any).history.back()}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
