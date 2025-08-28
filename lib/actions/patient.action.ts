"use server";

import { ID, InputFile, Models, Query } from "node-appwrite";
import { 
  APPOINTMENT_COLLECTION_ID, BUCKET_ID, DATABASE_ID,
  databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users
} from "../appwrite.config";
import { parseStringify } from "../utils";
import { Appointment, Patient } from "@/types/appwrite.types";

// CREATE USER
export const createUser = async (user: CreateUserParams) => {
  try {
    const newuser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    );
    return parseStringify(newuser);
  } catch (error: any) {
    if (error && error?.code === 409) {
      const existingUser = await users.list([
        Query.equal("email", [user.email]),
      ]);
      return existingUser.users[0];
    }
    console.error("An error occurred while creating a new user:", error);
  }
};

// GET USER
export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);
    return parseStringify(user);
  } catch (error) {
    console.error("An error occurred while retrieving the user details:", error);
  }
};

// GET PATIENT BY APPOINTMENT
export const getPatientAppointment = async (userId: string) => {
  try {
    const patient = await databases.getDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      userId, // Query by userId attribute
    );
    return parseStringify(patient);
  } catch (error) {
    console.error("An error occurred while retrieving the patient details:", error);
    return undefined; // Return undefined for errors (e.g., 404, network issues)
  }
};

// REGISTER PATIENT
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let fileId = null;
    let fileUrl = null;

    if (identificationDocument) {
      const blobFile = identificationDocument.get("blobFile") as Blob | null;
      const fileName = identificationDocument.get("fileName") as string;

      if (blobFile && fileName) {
        // Use InputFile.fromBlob() for Appwrite compatibility
        const inputFile = InputFile.fromBlob(blobFile, fileName);
        const file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
        fileId = file.$id;
        fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
      } else {
        console.warn("Identification document blob or filename is missing");
      }
    }

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: fileId,
        identificationDocumentUrl: fileUrl,
        ...patient,
      }
    );
    return parseStringify(newPatient);
  } catch (error) {
    console.error("An error occurred while creating a new patient:", error);
    throw error; // Re-throw to handle upstream (e.g., in the form component)
  }
};

// GET APPOINTMENTS WITH PATIENT INFO (FETCH PATIENT FROM PATIENT COLLECTION)
export async function getAppointmentsWithPatientInfo(patientId: string) {
  try {
    // Get appointments for the given patientId
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal("patientId", patientId)]
    );

    const documents = appointments.documents as Appointment[];

    // Fetch the patient document by patientId to get the userId
    const patientDoc = await databases.getDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      patientId
    ) as unknown as Patient; // Safe cast via unknown
    const userId = patientDoc.userId;

    // Fetch all patients for the userId to support multiple patients
    const allPatients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    );

    // Build patientsMap using patientId as key
    const patientsMap: Record<string, { name: string }> = {};
    allPatients.documents.forEach((doc: Models.Document, _: number, __: Models.Document[]) => {
      const patient = doc as unknown as Patient; // Safe cast via unknown
      patientsMap[patient.$id] = { name: patient.name || "Unknown Patient" };
    });

    return { appointments: documents, patientsMap };
  } catch (error) {
    console.error("An error occurred while retrieving appointments and patient info:", error);
    throw error;
  }
}

export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal('userId', userId)]
    );

    return parseStringify(patients.documents[0]);
  } catch (error) {
    console.error('An error occurred while fetching patient:', error);
  }
};
