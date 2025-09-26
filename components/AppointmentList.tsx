"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Appointment, Doctor } from "@/types/appwrite.types";
import { ArrowLeft, CalendarDays, MessageSquare } from "lucide-react";

interface AppointmentListProps {
  appointments: Appointment[];
  patients?: Record<string, { name: string }>;
  doctors: Doctor[];
}

export default function AppointmentList({
  appointments,
  patients = {},
  doctors = [],
}: AppointmentListProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105 transition"
      >
        <ArrowLeft size={16} />
      </button>

      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        My Appointments
      </h1>

      {appointments?.length > 0 ? (
        <ul className="space-y-6">
          {appointments.map((appointment) => {
            const doctorInfo = doctors.find((doc) => {
              if (doc.$id && doc.$id === appointment.primaryPhysician) return true;
              if (
                doc.name.trim().toLowerCase() ===
                appointment.primaryPhysician?.trim().toLowerCase()
              )
                return true;
              return false;
            });

            const patientId =
              typeof appointment.patientId === "object"
                ? appointment.patientId.$id
                : appointment.patientId;

            const patientName = patients[patientId]?.name || "Unknown Patient";

            const { dateTime } = formatDateTime(appointment.schedule);

            return (
              <li
                key={appointment?.$id}
                className="p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              >
                {/* Header: Patient + Status */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    👤 {patientName}
                  </p>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      appointment?.status
                    )}`}
                  >
                    {appointment?.status.charAt(0).toUpperCase() +
                      appointment?.status.slice(1)}
                  </span>
                </div>

                {/* Doctor Info */}
                <div className="flex items-center gap-4 mb-4">
                  {doctorInfo?.imageUrl ? (
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
                      <Image
                        src={doctorInfo.imageUrl}
                        alt={doctorInfo.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Doctor
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {doctorInfo?.name || appointment.primaryPhysician || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-2 text-gray-700 dark:text-gray-200 text-sm md:text-base">
                  <p className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-blue-500" /> {dateTime}
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-green-500" />{" "}
                    {appointment.reason || "No reason provided"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-500 text-center">No appointments found.</p>
      )}
    </div>
  );
}
