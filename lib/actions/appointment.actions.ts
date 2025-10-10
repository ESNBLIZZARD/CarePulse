"use server";

import { revalidatePath } from "next/cache";
import { ID, Models, Query } from "node-appwrite";
import { Appointment, Doctor, Patient } from "@/types/appwrite.types";
import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
  messaging,
  PATIENT_COLLECTION_ID,
} from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";

// Define the return type for getRecentAppointmentList
export interface AppointmentList {
  totalCount: number;
  scheduledCount: number;
  pendingCount: number;
  cancelledCount: number;
  completedCount: number;
  documents: Appointment[];
}

// GET RECENT APPOINTMENT
interface GetRecentAppointmentOptions {
  search?: string;
  status?: "all" | "scheduled" | "pending" | "cancelled" | "completed";
  startDate?: string;
  endDate?: string;
}

export const getRecentAppointmentList = async (
  options?: GetRecentAppointmentOptions
): Promise<AppointmentList | undefined> => {
  try {
    const queries: Query[] = [Query.orderDesc("$createdAt")];

    // Filter by status only if it's not "all"
    if (options?.status && options.status !== "all") {
      queries.push(Query.equal("status", options.status));
    }

    // Date range filtering
    if (options?.startDate) {
      queries.push(Query.greaterThanEqual("schedule", options.startDate));
    }
    if (options?.endDate) {
      queries.push(Query.lessThanEqual("schedule", options.endDate));
    }

    // Fetch appointments
    const appointmentsRes = await databases.listDocuments(
      process.env.DATABASE_ID!,
      process.env.APPOINTMENT_COLLECTION_ID!,
      queries as any[]
    );

    let appointments = appointmentsRes.documents as Appointment[];

    // Fetch doctors
    const doctorsRes = await databases.listDocuments(
      process.env.DATABASE_ID!,
      process.env.DOCTOR_COLLECTION_ID!
    );
    const doctors: Doctor[] = doctorsRes.documents.map((doc: any) => ({
      $id: doc.$id,
      name: doc.name,
      imageId: doc.imageId,
    }));

    // Fetch all patients once
    const patientsRes = await databases.listDocuments(
      process.env.DATABASE_ID!,
      process.env.PATIENT_COLLECTION_ID!
    );
    const patients = patientsRes.documents as Patient[];

    // Map patientId → Patient
    const patientsMap: Record<string, Patient> = {};
    patients.forEach((p) => {
      patientsMap[p.$id] = p;
    });

    // Merge doctor + patient info into appointments
    const appointmentsWithInfo: (Appointment & { doctor: Doctor; patient: Patient | null })[] =
      appointments.map((appt) => {
        const doctor = doctors.find((d) => d.name === appt.primaryPhysician);
        const patient = patientsMap[typeof appt.patientId === "string" ? appt.patientId : appt.patientId.$id] ?? null;

        const imageUrl = doctor?.imageId
          ? `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_BUCKET_ID}/files/${doctor.imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
          : undefined;

        return {
          ...appt,
          doctor: {
            $id: doctor?.$id,
            name: doctor?.name || appt.primaryPhysician,
            imageUrl,
          },
          patient, 
        };
      });

    // Apply search filter manually (doctor + patient fields)
    let filteredAppointments = appointmentsWithInfo;
    if (options?.search) {
      const searchLower = options.search.toLowerCase().trim();

      filteredAppointments = appointmentsWithInfo.filter((appt) => {
        const doctorMatch = appt.doctor?.name?.toLowerCase().includes(searchLower);

        const patientMatch = appt.patient?.name?.toLowerCase().includes(searchLower);
        const emailMatch = appt.patient?.email?.toLowerCase().includes(searchLower);
        const phoneMatch = appt.patient?.phone?.toLowerCase().includes(searchLower);

        return doctorMatch || patientMatch || emailMatch || phoneMatch;
      });
    }

    // Count statuses from filtered results
    const counts = filteredAppointments.reduce(
      (acc, appointment) => {
        switch (appointment.status) {
          case "scheduled":
            acc.scheduledCount++;
            break;
          case "pending":
            acc.pendingCount++;
            break;
          case "cancelled":
            acc.cancelledCount++;
            break;
          case "completed":
            acc.completedCount++;
            break;
        }
        return acc;
      },
      {
        scheduledCount: 0,
        pendingCount: 0,
        cancelledCount: 0,
        completedCount: 0,
      }
    );

    return {
      totalCount: filteredAppointments.length,
      scheduledCount: counts.scheduledCount,
      pendingCount: counts.pendingCount,
      cancelledCount: counts.cancelledCount,
      completedCount: counts.completedCount,
      documents: filteredAppointments,
    };
  } catch (error) {
    console.error("Error fetching recent appointments:", error);
  }
};


// CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      {
        ...appointment,
        patientId: appointment.patientId, 
      }
    );

    revalidatePath("/admin");
    return parseStringify(newAppointment);
  } catch (error) {
    console.error("An error occurred while creating a new appointment:", error);
  }
};

// SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );
    return parseStringify(message);
  } catch (error) {
    console.error("An error occurred while sending sms:", error);
  }
};

// UPDATE APPOINTMENT
export const updateAppointment = async ({
  appointmentId,
  userId,
  timeZone,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    if (type === "complete") {
      const currentAppointment = (await databases.getDocument(
        DATABASE_ID!,
        APPOINTMENT_COLLECTION_ID!,
        appointmentId
      )) as Appointment;
      if (currentAppointment.status !== "scheduled") {
        throw new Error(
          "Only scheduled appointments can be marked as completed"
        );
      }
    }

    const updateData = {
      patientId:
        typeof appointment.patientId === "string"
          ? appointment.patientId
          : appointment.patientId?.$id,
      status: appointment.status,
      schedule: appointment.schedule,
      primaryPhysician: appointment.primaryPhysician,
      reason: appointment.reason,
      note: appointment.note,
      userId: appointment.userId,
      cancellationReason: appointment.cancellationReason,
    };

    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      updateData
    );

    if (!updatedAppointment) throw new Error("Failed to update appointment");

    let smsMessage = "";
    if (type === "schedule") {
      smsMessage = `Greetings from CarePulse. Your appointment is confirmed for ${formatDateTime(appointment.schedule!, timeZone).dateTime} with Dr. ${appointment.primaryPhysician}.`;
    } else if (type === "cancel") {
      smsMessage = `Greetings from CarePulse. We regret to inform that your appointment for ${formatDateTime(appointment.schedule!, timeZone).dateTime} is cancelled. Reason: ${appointment.cancellationReason ?? "Not specified"}.`;
    } else if (type === "complete") {
      smsMessage = `Greetings from CarePulse. Your appointment with Dr. ${appointment.primaryPhysician} on ${formatDateTime(appointment.schedule!, timeZone).dateTime} has been marked as completed.`;
    }

    await sendSMSNotification(userId, smsMessage);

    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.error("An error occurred while updating an appointment:", error);
    throw error;
  }
};

// GET APPOINTMENTS WITH PATIENT INFO
export async function getAppointmentsWithPatientInfo(patientId: string) {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal("patientId", patientId)]
    );
    const documents = appointments.documents as Appointment[];

    const patientDoc = (await databases.getDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      patientId
    )) as Patient;
    const userId = patientDoc.userId;

    const allPatients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    );

    const patientsMap: Record<string, { name: string }> = {};
    allPatients.documents.forEach((doc: Models.Document) => {
      const patient = doc as Patient;
      patientsMap[patient.$id] = { name: patient.name || "Unknown Patient" };
    });

    return { appointments: documents, patientsMap };
  } catch (error) {
    console.error(
      "An error occurred while retrieving appointments and patient info:",
      error
    );
    throw error;
  }
}

// GET APPOINTMENTS BY PATIENT ID
export async function getAppointmentsByPatientId(patientId: string) {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal("patientId", patientId)]
    );
    return appointments.documents as Appointment[];
  } catch (error) {
    console.error(
      "An error occurred while retrieving appointments by patientId:",
      error
    );
    throw error;
  }
}

// GET SINGLE APPOINTMENT
export async function getAppointment(
  appointmentId: string
): Promise<Appointment | null> {
  try {
    const appointment = (await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    )) as Appointment;
    return appointment;
  } catch (error) {
    console.error("An error occurred while retrieving appointment:", error);
    return null;
  }
}