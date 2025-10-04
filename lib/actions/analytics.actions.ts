"use server";

import { databases, APPOINTMENT_COLLECTION_ID, DATABASE_ID } from "@/lib/appwrite.config";

export interface DoctorAnalytics {
  doctor: string;
  appointments: number;
  cancellations: number;
}

export interface AdminAnalytics {
  totalAppointments: number;
  totalCancellations: number;
  doctorStats: DoctorAnalytics[];
}

export async function getAdminAnalytics(filterDoctor?: string): Promise<AdminAnalytics | null> {
  try {
    if (!DATABASE_ID || !APPOINTMENT_COLLECTION_ID) {
      throw new Error("Database or Appointments collection ID not set in env");
    }

    const appointmentsRes = await databases.listDocuments(DATABASE_ID, APPOINTMENT_COLLECTION_ID);
    const appointments = appointmentsRes.documents as any[];

    const doctorStatsMap: Record<string, { appointments: number; cancellations: number }> = {};

    appointments.forEach((appt) => {
      const doctor = appt.doctorId || appt.primaryPhysician || "Unknown";

      if (filterDoctor && doctor !== filterDoctor) return;

      if (!doctorStatsMap[doctor]) {
        doctorStatsMap[doctor] = { appointments: 0, cancellations: 0 };
      }

      if (appt.status === "cancelled") {
        doctorStatsMap[doctor].cancellations += 1;
      } else {
        doctorStatsMap[doctor].appointments += 1;
      }
    });

    const doctorStats: DoctorAnalytics[] = Object.entries(doctorStatsMap).map(
      ([doctor, stats]) => ({
        doctor,
        appointments: stats.appointments,
        cancellations: stats.cancellations,
      })
    );

    const totalAppointments = doctorStats.reduce((sum, d) => sum + d.appointments, 0);
    const totalCancellations = doctorStats.reduce((sum, d) => sum + d.cancellations, 0);

    return {
      totalAppointments,
      totalCancellations,
      doctorStats,
    };
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return null;
  }
}
