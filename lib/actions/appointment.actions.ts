"use server";

import { revalidatePath } from "next/cache";
import { ID, Models, Query } from "node-appwrite";

import { Appointment, Patient } from "@/types/appwrite.types";

import {
  APPOINTMENT_COLLECTION_ID,
  DATABASE_ID,
  databases,
  messaging,
  PATIENT_COLLECTION_ID,
} from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";

// Define the return type for getRecentAppointmentList
interface AppointmentList {
  totalCount: number;
  scheduledCount: number;
  pendingCount: number;
  cancelledCount: number;
  completedCount: number;
  documents: Appointment[];
}

// CREATE APPOINTMENT
export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    // Ensure patientId is a string, as CreateAppointmentParams defines it as string
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      {
        ...appointment,
        patientId: appointment.patientId, // patientId is guaranteed to be a string from CreateAppointmentParams
      }
    );

    revalidatePath("/admin");
    return parseStringify(newAppointment);
  } catch (error) {
    console.error("An error occurred while creating a new appointment:", error);
  }
};

// GET RECENT APPOINTMENTS
export const getRecentAppointmentList = async (): Promise<AppointmentList | undefined> => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.orderDesc("$createdAt")]
    );

    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
      completedCount: 0,
    };

    const counts = (appointments.documents as Appointment[]).reduce(
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
      initialCounts
    );

    const data: AppointmentList = {
      totalCount: appointments.total,
      scheduledCount: counts.scheduledCount,
      pendingCount: counts.pendingCount,
      cancelledCount: counts.cancelledCount,
      completedCount: counts.completedCount,
      documents: appointments.documents as Appointment[],
    };

    return parseStringify(data);
  } catch (error) {
    console.error(
      "An error occurred while retrieving the recent appointments:",
      error
    );
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
    // Validate that only scheduled appointments can be marked as completed
    if (type === "complete") {
      const currentAppointment = (await databases.getDocument(
        DATABASE_ID!,
        APPOINTMENT_COLLECTION_ID!,
        appointmentId
      )) as Appointment;
      if (currentAppointment.status !== "scheduled") {
        throw new Error("Only scheduled appointments can be marked as completed");
      }
    }

    // Filter out Appwrite metadata and include only valid fields
    const updateData = {
      patientId: typeof appointment.patientId === "string" ? appointment.patientId : appointment.patientId?.$id,
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
    console.log("Fetching appointments for patientId:", patientId);
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal("patientId", patientId)]
    );
    const documents = appointments.documents as Appointment[];
    console.log("Fetched Appointments:", documents);

    console.log("Fetching patient doc for patientId:", patientId);
    const patientDoc = (await databases.getDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      patientId
    )) as Patient;
    console.log("Fetched Patient Doc:", patientDoc);
    const userId = patientDoc.userId;
    console.log("Extracted userId:", userId);

    console.log("Fetching all patients for userId:", userId);
    const allPatients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    );
    console.log("Fetched All Patients:", allPatients.documents);

    const patientsMap: Record<string, { name: string }> = {};
    allPatients.documents.forEach((doc: Models.Document) => {
      const patient = doc as Patient;
      console.log("Processing Patient:", patient);
      patientsMap[patient.$id] = { name: patient.name || "Unknown Patient" };
    });
    console.log("Generated Patients Map:", patientsMap);

    return { appointments: documents, patientsMap };
  } catch (error) {
    console.error("An error occurred while retrieving appointments and patient info:", error);
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
    console.error("An error occurred while retrieving appointments by patientId:", error);
    throw error;
  }
}

// GET SINGLE APPOINTMENT
export async function getAppointment(appointmentId: string): Promise<Appointment | null> {
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