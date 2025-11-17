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
export const getPatientAppointment = async (id: string) => {
  try {
    let patient: Models.Document | null = null;

    try {
      // Try direct fetch by document ID
      patient = await databases.getDocument(
        DATABASE_ID!,
        PATIENT_COLLECTION_ID!,
        id
      );
    } catch (error: any) {
      if (error?.code === 404) {
        // Try fetching by userId
        const patients = await databases.listDocuments(
          DATABASE_ID!,
          PATIENT_COLLECTION_ID!,
          [Query.equal("userId", id)]
        );

        if (patients.total > 0) {
          patient = patients.documents[0];
        } else {
          console.warn(`⚠️ No patient found for userId/documentId: ${id}`);
          return null;
        }
      } else {
        throw error;
      }
    }

    return parseStringify(patient);
  } catch (error) {
    console.error("An error occurred while retrieving patient details:", error);
    return null;
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
    if (!patientId) throw new Error("Missing patientId");

    // Step 1: Get all appointments linked to this patientId
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal("patientId", patientId)]
    );
    const documents = appointments.documents as Appointment[];

    // Step 2: Try to get the patient document
    let patientDoc: Patient | null = null;

    try {
      // Try direct lookup first
      const found = await databases.getDocument(
        DATABASE_ID!,
        PATIENT_COLLECTION_ID!,
        patientId
      );
      patientDoc = found as unknown as Patient;
    } catch (error: any) {
      if (error?.code === 404) {
        // If not found by ID, search by userId
        const patientsList = await databases.listDocuments(
          DATABASE_ID!,
          PATIENT_COLLECTION_ID!,
          [Query.equal("userId", patientId)]
        );

        if (patientsList.total > 0) {
          patientDoc = patientsList.documents[0] as unknown as Patient;
        } else {
          console.warn("⚠️ No patient found for the given patientId or userId:", patientId);
        }
      } else {
        throw error;
      }
    }

    // Step 3: Build the patient map
    const patientsMap: Record<string, { name: string }> = {};

    if (patientDoc?.userId) {
      const allPatients = await databases.listDocuments(
        DATABASE_ID!,
        PATIENT_COLLECTION_ID!,
        [Query.equal("userId", patientDoc.userId)]
      );

      allPatients.documents.forEach((doc: Models.Document) => {
        const patient = doc as unknown as Patient;
        patientsMap[patient.$id] = { name: patient.name || "Unknown Patient" };
      });
    }

    return { appointments: documents, patientsMap };
  } catch (error) {
    console.error("🚨 Error retrieving appointments and patient info:", error);
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
