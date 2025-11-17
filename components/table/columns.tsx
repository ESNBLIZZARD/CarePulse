"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";

import { formatDateTime } from "@/lib/utils";
import { Appointment, Doctor } from "@/types/appwrite.types";

import { AppointmentModal } from "../AppointmentModal";
import { StatusBadge } from "../StatusBadge";
import { UploadReportModal } from "../UploadReportModal";
import { ViewReportsModal } from "../ViewReportModal";

export const columns: ColumnDef<Appointment & { doctor: Doctor }>[] = [
  {
    header: "#",
    cell: ({ row }) => <p className="text-14-medium">{row.index + 1}</p>,
  },
  {
    accessorKey: "patient",
    header: "Patient",
    cell: ({ row }) => <p className="text-14-medium">{row.original.patient.name}</p>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="min-w-[115px]">
        <StatusBadge status={row.original.status} />
      </div>
    ),
  },
  {
    accessorKey: "schedule",
    header: "Appointment",
    cell: ({ row }) => (
      <p className="text-14-regular min-w-[100px]">
        {formatDateTime(row.original.schedule).dateTime}
      </p>
    ),
  },
  {
    accessorKey: "doctor",
    header: "Doctor",
    cell: ({ row }) => {
      const doctor = row.original.doctor;

      const imageSrc =
        doctor?.imageUrl || (typeof doctor?.image === "string" ? doctor.image : undefined);

      return (
        <div className="flex items-center gap-3">
          {imageSrc ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300">
              <Image
                src={imageSrc}
                alt={doctor?.name || "Doctor"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm text-gray-500">
              {doctor?.name?.charAt(0)}
            </div>
          )}
          <p className="whitespace-nowrap">Dr. {doctor?.name}</p>
        </div>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="pl-4">Actions</div>,
    cell: ({ row }) => {
      const appointment = row.original;

      return (
        <div className="flex gap-1">
          {appointment.status === "pending" && (
            <AppointmentModal
              patientId={appointment.patient.$id}
              userId={appointment.userId}
              appointment={appointment}
              type="schedule"
              title="Schedule Appointment"
              description="Please confirm the following details to schedule."
            />
          )}
          {appointment.status === "scheduled" && (
            <AppointmentModal
              patientId={appointment.patient.$id}
              userId={appointment.userId}
              appointment={appointment}
              type="complete"
              title="Complete Appointment"
              description={`Are you sure you want to mark the appointment with Dr. ${appointment.doctor?.name} as completed?`}
            />
          )}
          {appointment.status === "cancelled" && (
            <AppointmentModal
              patientId={appointment.patient.$id}
              userId={appointment.userId}
              appointment={appointment}
              type="schedule"
              title="Reschedule Appointment"
              description="Please provide new details to reschedule this appointment."
            />
          )}
          {appointment.status !== "cancelled" && appointment.status !== "completed" && (
            <AppointmentModal
              patientId={appointment.patient.$id}
              userId={appointment.userId}
              appointment={appointment}
              type="cancel"
              title="Cancel Appointment"
              description="Are you sure you want to cancel your appointment?"
            />
          )}

          {/* // UPLOAD REPORT-------- */}
          {appointment.status === "completed" && (
            <div className="flex items-center gap-2">
              {/* Show Upload button for admin/doctor users (assume admin sees this table) */}
              <UploadReportModal appointmentId={appointment.$id} />

              {/* If there are reports, show view modal */}
              {appointment.reports && appointment.reports.length > 0 && (
                <ViewReportsModal appointment={appointment} isAdmin/>
              )}
            </div>
          )}
          {/*
          {appointment.status === "completed" && (
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="text-14-regular text-gray-700 p-1 border border-gray-300 rounded"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    console.log("Uploading file:", file.name);
                    // Implement upload logic here (e.g., using a server action or API)
                  }
                }}
              />
              <button
                className="text-14-medium text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded"
                onClick={() => {
                  console.log("Upload triggered");
                  // Implement upload submission
                }}
              >
                Upload
              </button>
            </div>
          )}
          */}
        </div>
      );
    },
  },
];