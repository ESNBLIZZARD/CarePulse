"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Appointment } from "@/types/appwrite.types";
import { Doctors } from "@/constants";

interface AppointmentListProps {
  appointments: Appointment[];
  patients?: Record<string, { name: string }>;
}

export default function AppointmentList({
  appointments,
  patients = {},
}: AppointmentListProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <button
        onClick={handleBack}
        className="inline-flex items-center text-white hover:text-gray transition-colors mb-6"
      >
        <span className="mr-2 text-sm color-primary">←</span> Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-center">My Appointments</h1>

      {appointments.length > 0 ? (
        <ul className="space-y-4">
          {appointments.map((appointment) => {
            const doctorInfo = Doctors.find(
              (doc) => doc.name === appointment.primaryPhysician
            );
            // Extract $id from the patientId object
            const patientId =
              typeof appointment.patientId === "object"
                ? appointment.patientId.$id
                : appointment.patientId;

            const patientName = patients[patientId]?.name || "Unknown Patient";
            console.log("Appointment:", appointment);
            console.log("Extracted Patient ID:", patientId);
            console.log(
              "Patients Map Entry for Patient ID:",
              patients[patientId]
            );

            const { dateTime } = formatDateTime(appointment.schedule);

            return (
              <li
                key={appointment.$id}
                className="p-6 border rounded-2xl shadow-md hover:shadow-xl transition-shadow bg-white dark:bg-gray-900 space-y-4"
              >
                {/* Patient Info */}
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    👤Patient Name: {patientName}
                  </p>
                </div>

                {/* Doctor Info */}
                <div className="flex items-center gap-3">
                  {doctorInfo && (
                    <Image
                      src={doctorInfo.image}
                      width={56}
                      height={56}
                      alt={doctorInfo.name}
                      className="rounded-full border border-gray-300 dark:border-gray-700"
                    />
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Doctor
                    </p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {doctorInfo?.name || appointment.primaryPhysician}
                    </p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-2 text-sm md:text-base text-gray-700 dark:text-gray-200">
                  <p>📅 {dateTime}</p>
                  <p>💬 Reason: {appointment.reason || "N/A"}</p>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full w-fit ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </span>
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
