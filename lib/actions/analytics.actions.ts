import { databases, APPOINTMENT_COLLECTION_ID, DATABASE_ID, DOCTOR_COLLECTION_ID } from "@/lib/appwrite.config";
import { Appointment, Doctor } from "@/types/appwrite.types";
import { Query } from "node-appwrite";

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

export const getAdminAnalytics = async (
  doctor?: string,
  startDate?: string,
  endDate?: string
) => {
  try {
    const queries: any[] = [];

    if (doctor) queries.push(Query.equal("primaryPhysician", doctor));
    if (startDate) queries.push(Query.greaterThanEqual("schedule", startDate));
    if (endDate) queries.push(Query.lessThanEqual("schedule", endDate));

    const appointmentsRes = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      queries
    );

    const appointments = appointmentsRes.documents as Appointment[];

    // fetch doctors and map to Doctor type
    const doctorsRes = await databases.listDocuments(DATABASE_ID!, DOCTOR_COLLECTION_ID!);
    const doctors: Doctor[] = doctorsRes.documents
      .filter((d: any) => !!d.name) // ensure name exists
      .map((d: any) => ({
        $id: d.$id,
        name: d.name,
        specialization: d.specialization || undefined,
        experience: d.experience || undefined,
        email: d.email || undefined,
        phone: d.phone || undefined,
        imageId: d.imageId || undefined,
        imageUrl: d.imageUrl || undefined,
      }));

    const totalAppointments = appointments.length;
    const totalCancellations = appointments.filter((a) => a.status === "cancelled").length;

    const doctorStats: DoctorAnalytics[] = doctors.map((doc) => {
      const docAppointments = appointments.filter((a) => a.primaryPhysician === doc.name);
      const docCancellations = docAppointments.filter((a) => a.status === "cancelled").length;

      return {
        doctor: doc.name,
        appointments: docAppointments.length,
        cancellations: docCancellations,
      };
    });

    return {
      totalAppointments,
      totalCancellations,
      doctorStats,
    };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    throw error;
  }
};
