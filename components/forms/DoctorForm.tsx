"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { FileUploader } from "../FileUploader";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form";
import { createDoctor, updateDoctor } from "@/lib/actions/doctor.actions";
import { Doctor } from "@/types/appwrite.types";

const DoctorFormValidation = z.object({
    name: z.string().min(2, "Name is required"),
    specialization: z.string().optional(),
    experience: z.preprocess((val) => Number(val), z.number().min(0).optional()),
    email: z.string().email("Invalid email").optional(),
    phone: z
        .string()
        .refine((val) => val.startsWith("+") || !val, {
            message: "Phone number must be in international format (e.g., +919876543210)",
        })
        .optional(),
    image: z.any().optional(),
});

interface DoctorFormProps {
    doctor?: Doctor;
    onSuccess?: () => void;
}

const DoctorForm = ({ doctor, onSuccess }: DoctorFormProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [previewFiles, setPreviewFiles] = useState<File[]>([]);

    const form = useForm<z.infer<typeof DoctorFormValidation>>({
        resolver: zodResolver(DoctorFormValidation),
        defaultValues: {
            name: "",
            specialization: "",
            experience: undefined,
            email: "",
            phone: "",
            image: [],
        },
    });

    // Prefill form with doctor data and set initial preview if imageUrl exists
    useEffect(() => {
        if (doctor) {
            form.reset({
                name: doctor.name || "",
                specialization: doctor.specialization || "",
                experience: doctor.experience || undefined,
                email: doctor.email || "",
                phone: doctor.phone || "",
                image: [],
            });
        } else {
            setPreviewFiles([]);
        }
    }, [doctor, form]);

    const onSubmit = async (values: z.infer<typeof DoctorFormValidation>) => {
        setIsLoading(true);
        try {
            const doctorData: Partial<Doctor> & { image?: FormData } = {
                name: values.name,
                specialization: values.specialization,
                experience: values.experience,
                email: values.email,
                phone: values.phone || "",
            };

            // Handle image
            if (values.image && values.image.length > 0) {
                const file = values.image[0];

                if (file instanceof File) {
                    const formData = new FormData();
                    formData.append("blobFile", file);
                    formData.append("fileName", file.name);
                    doctorData.image = formData;
                }
            }

            if (doctor?.$id) {
                await updateDoctor(doctor.$id, doctorData);
            } else {
                await createDoctor(doctorData as Doctor & { image?: FormData });
            }

            form.reset();
            setPreviewFiles([]);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error saving doctor:", error);
            form.setError("image", { message: "Failed to upload image. Check file type or size." });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle file selection and update form
    const handleFileChange = (files: File[]) => {
        form.setValue("image", files);
        setPreviewFiles(files);
    };

    // Trigger file input manually
    const handleUploadClick = () => {
        const input = document.querySelector(".file-upload input[type='file']") as HTMLInputElement;
        if (input) input.click();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start gap-8">                
                    {/* Left: Profile Image */}
                    <div className="flex-shrink-0 relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-300 shadow-md">
                            {doctor?.imageUrl && !previewFiles.length ? (
                                <img
                                    src={doctor.imageUrl}
                                    alt={doctor.name || "Doctor profile"}
                                    className="w-full h-full object-cover"
                                />
                            ) : previewFiles.length > 0 ? (
                                <img
                                    src={URL.createObjectURL(previewFiles[0])}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <FileUploader files={previewFiles} onChange={handleFileChange} />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleUploadClick}
                            className="mt-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600 absolute bottom-0 right-0 transform translate-y-1/2"
                            aria-label="Upload or replace doctor profile image"
                        >
                            {doctor?.imageUrl || previewFiles.length > 0 ? "Replace" : "Upload"}
                        </button>

                        {form.formState.errors.image?.message && (
                            <p className="text-red-500 text-sm mt-2">
                                {String(form.formState.errors.image.message)}
                            </p>
                        )}
                    </div>


                    {/* Right: Form Fields */}
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Name, Specialization, Experience */}
                            <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="name" label="Full Name" placeholder="Dr. John Doe" />
                            <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="specialization" label="Specialization" placeholder="Cardiology, Neurology..." />
                            <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="experience" label="Experience (years)" placeholder="5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CustomFormField fieldType={FormFieldType.INPUT} control={form.control} name="email" label="Email" placeholder="doctor@example.com" />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            international
                                            defaultCountry="IN"
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="input-phone w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>
                </div>

                <div className="flex mt-6 w-[50%]">
                    <SubmitButton isLoading={isLoading}>
                        {doctor ? "Update" : "Add"}
                    </SubmitButton>
                </div>

            </form>
        </Form>
    );
};

export default DoctorForm;