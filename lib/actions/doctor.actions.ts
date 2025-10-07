"use server";

import { ID, InputFile, Models, Query } from "node-appwrite";
import {
  APPOINTMENT_COLLECTION_ID,
  BUCKET_ID,
  databases,
  ENDPOINT,
  PROJECT_ID,
  storage,
} from "../appwrite.config";
import { Doctor } from "@/types/appwrite.types";

const DOCTOR_COLLECTION_ID = process.env.DOCTOR_COLLECTION_ID!;
const DATABASE_ID = process.env.DATABASE_ID!;

// CREATE DOCTOR
export const createDoctor = async (doctor: Doctor & { image?: FormData }) => {
  try {
    let fileId: string | null = null;
    let fileUrl: string | null = null;

    if (doctor.image) {
      const blobFile = doctor.image.get("blobFile") as Blob | null;
      const fileName = doctor.image.get("fileName") as string;

      if (blobFile && fileName) {
        const prefixedFileName = `doctor_${Date.now()}_${fileName}`;
        const inputFile = InputFile.fromBlob(blobFile, prefixedFileName);
        const file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);

        fileId = file.$id;
        fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
      }
    }

    const formattedAvailability = JSON.stringify(doctor.availability || {});

    const newDoctor = await databases.createDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      ID.unique(),
      {
        name: doctor.name,
        specialization: doctor.specialization || null,
        experience: doctor.experience || null,
        email: doctor.email || null,
        phone: doctor.phone || null,
        ...(fileId && { imageId: fileId, imageUrl: fileUrl }),
        availability: formattedAvailability,
      }
    );

    return newDoctor;
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
};

// GET ALL DOCTORS
export const getDoctors = async (): Promise<Doctor[]> => {
  try {
    const response = await databases.listDocuments<Models.Document>(
      DATABASE_ID,
      DOCTOR_COLLECTION_ID
    );

    const doctors: Doctor[] = response.documents.map((doc) => {
      const raw = doc as unknown as Doctor;
      return {
        ...raw,
        availability: raw.availability
          ? JSON.parse(raw.availability as unknown as string)
          : {},
      };
    });

    return doctors;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }
};

export const getDoctorById = async (
  doctorId: string
): Promise<Doctor | null> => {
  try {
    const doc = await databases.getDocument<Models.Document>(
      DATABASE_ID,
      DOCTOR_COLLECTION_ID,
      doctorId
    );

    const raw = doc as unknown as Doctor;

    return {
      ...raw,
      availability: raw.availability
        ? JSON.parse(raw.availability as unknown as string)
        : {},
    };
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return null;
  }
};

// UPDATE DOCTOR
export const updateDoctor = async (
  doctorId: string,
  doctor: Partial<Doctor> & { image?: FormData }
) => {
  try {
    let fileId: string | null = null;
    let fileUrl: string | null = null;

    if (doctor.image) {
      const blobFile = doctor.image.get("blobFile") as Blob | null;
      const fileName = doctor.image.get("fileName") as string;

      if (blobFile && fileName) {
        const prefixedFileName = `doctor_${Date.now()}_${fileName}`;
        const inputFile = InputFile.fromBlob(blobFile, prefixedFileName);
        const file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);

        fileId = file.$id;
        fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
      }
    }

    const formattedAvailability = JSON.stringify(doctor.availability || {});

    const updated = await databases.updateDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorId,
      {
        name: doctor.name,
        specialization: doctor.specialization || null,
        experience: doctor.experience || null,
        email: doctor.email || null,
        phone: doctor.phone || null,
        ...(fileId && { imageId: fileId, imageUrl: fileUrl }),
        availability: formattedAvailability,
      }
    );

    return updated;
  } catch (error) {
    console.error("Error updating doctor:", error);
    throw error;
  }
};

// DELETE DOCTOR
export const deleteDoctor = async (doctorId: string) => {
  try {
    // Step 1: Get doctor details (for image cleanup)
    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      throw new Error(`Doctor with ID ${doctorId} not found`);
    }

    // Step 2: Find all appointments associated with this doctor
    const appointmentsToDelete = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [
        Query.equal("primaryPhysician", doctorId),
        Query.equal("primaryPhysician", doctor.name),
      ]
    );

    console.log(
      `Found ${appointmentsToDelete.documents.length} appointments to delete for doctor: ${doctor.name}`
    );

    // Step 3: Delete all associated appointments
    const deletePromises = appointmentsToDelete.documents.map(
      async (appointment) => {
        try {
          await databases.deleteDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            appointment.$id
          );
          console.log(`Deleted appointment: ${appointment.$id}`);
        } catch (error) {
          console.error(
            `Failed to delete appointment ${appointment.$id}:`,
            error
          );
        }
      }
    );
    await Promise.allSettled(deletePromises);

    // Step 4: Delete doctor's image from storage (if exists)
    if (doctor.imageId) {
      try {
        await storage.deleteFile(BUCKET_ID!, doctor.imageId);
        console.log(`Deleted doctor image: ${doctor.imageId}`);
      } catch (error) {
        console.error("Failed to delete doctor image:", error);
      }
    }

    // Step 5: Delete the doctor document
    await databases.deleteDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorId
    );
    console.log(
      `Successfully deleted doctor: ${doctor.name} and all associated data`
    );

    return {
      success: true,
      message: `Doctor ${doctor.name} and ${appointmentsToDelete.documents.length} associated appointments deleted successfully`,
      deletedAppointments: appointmentsToDelete.documents.length,
    };
  } catch (error) {
    console.error("Error deleting doctor:", error);
    throw error;
  }
};
