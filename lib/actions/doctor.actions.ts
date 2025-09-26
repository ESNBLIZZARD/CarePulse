"use server";

import { ID, InputFile, Query } from "node-appwrite";
import { APPOINTMENT_COLLECTION_ID, BUCKET_ID, databases, ENDPOINT, PROJECT_ID, storage } from "../appwrite.config";
import { Doctor } from "@/types/appwrite.types";

const DOCTOR_COLLECTION_ID = process.env.DOCTOR_COLLECTION_ID!;
const DATABASE_ID = process.env.DATABASE_ID!;

// CREATE DOCTOR
export const createDoctor = async (doctor: Doctor & { image?: FormData }) => {
  try {
    let fileId = null;
    let fileUrl = null;

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

    const newDoctor = await databases.createDocument(
      DATABASE_ID,
      DOCTOR_COLLECTION_ID,
      ID.unique(),
      {
        name: doctor.name,
        specialization: doctor.specialization || null,
        experience: doctor.experience || null,
        email: doctor.email || null,
        phone: doctor.phone || null,
        ...(fileId && { imageId: fileId, imageUrl: fileUrl }),
      }
    );

    return newDoctor;
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
};

// GET ALL DOCTORS
export const getDoctors = async () => {
  try {
    const doctor = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!
    );
    const response = await databases.listDocuments(DATABASE_ID!, DOCTOR_COLLECTION_ID!);
    console.log("Raw Doctor Response:", response);
    return doctor.documents as unknown as Doctor[];
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw error;
  }
};

// GET SINGLE DOCTOR
export const getDoctorById = async (doctorId: string) => {
  try {
    const doctor = await databases.getDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorId
    );
    return doctor as unknown as Doctor;
  } catch (error) {
    console.error("Error fetching doctor:", error);
    throw error;
  }
};

// UPDATE DOCTOR
export const updateDoctor = async (doctorId: string, doctor: Partial<Doctor> & { image?: FormData }) => {
  try {
    let fileId = null;
    let fileUrl = null;

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

    const updated = await databases.updateDocument(
      DATABASE_ID,
      DOCTOR_COLLECTION_ID,
      doctorId,
      {
        name: doctor.name,
        specialization: doctor.specialization || null,
        experience: doctor.experience || null,
        email: doctor.email || null,
        phone: doctor.phone || null,
        ...(fileId && { imageId: fileId, imageUrl: fileUrl }),
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
    
    // Step 2: Find all appointments associated with this doctor
    const appointmentsToDelete = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [
        // Search by doctor ID
        Query.equal("primaryPhysician", doctorId),
        // Also search by doctor name (in case appointments store doctor name instead of ID)
        Query.equal("primaryPhysician", doctor.name),
      ]
    );

    console.log(`Found ${appointmentsToDelete.documents.length} appointments to delete for doctor: ${doctor.name}`);

    // Step 3: Delete all associated appointments
    const deletePromises = appointmentsToDelete.documents.map(async (appointment) => {
      try {
        await databases.deleteDocument(
          DATABASE_ID!,
          APPOINTMENT_COLLECTION_ID!,
          appointment.$id
        );
        console.log(`Deleted appointment: ${appointment.$id}`);
      } catch (error) {
        console.error(`Failed to delete appointment ${appointment.$id}:`, error);
        // Continue with other deletions even if one fails
      }
    });

    // Wait for all appointment deletions to complete
    await Promise.allSettled(deletePromises);

    // Step 4: Delete doctor's image from storage (if exists)
    if (doctor.imageId) {
      try {
        await storage.deleteFile(BUCKET_ID!, doctor.imageId);
        console.log(`Deleted doctor image: ${doctor.imageId}`);
      } catch (error) {
        console.error("Failed to delete doctor image:", error);
        // Continue with doctor deletion even if image deletion fails
      }
    }

    // Step 5: Delete the doctor document
    await databases.deleteDocument(DATABASE_ID!, DOCTOR_COLLECTION_ID!, doctorId);
    console.log(`Successfully deleted doctor: ${doctor.name} and all associated data`);

    return {
      success: true,
      message: `Doctor ${doctor.name} and ${appointmentsToDelete.documents.length} associated appointments deleted successfully`,
      deletedAppointments: appointmentsToDelete.documents.length
    };
  } catch (error) {
    console.error("Error deleting doctor:", error);
    throw error;
  }
};