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
import { Camera, Upload, User, Stethoscope, Award, Mail, Phone as PhoneIcon } from "lucide-react";

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
    const [isDragging, setIsDragging] = useState(false);

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Profile Image Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-2xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 sm:p-8">
                        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                            {/* Profile Image Upload */}
                            <div className="relative group">
                                <div className="relative">
                                    {/* Animated Ring */}
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition-opacity duration-300" />
                                    
                                    {/* Image Container */}
                                    <div 
                                        className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-gray-900 shadow-2xl transition-transform duration-300 ${
                                            isDragging ? 'scale-105' : 'group-hover:scale-105'
                                        }`}
                                        onDragEnter={() => setIsDragging(true)}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={() => setIsDragging(false)}
                                    >
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
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                                                <User size={64} className="text-gray-600" />
                                            </div>
                                        )}
                                        
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <Camera size={32} className="text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Button */}
                                <button
                                    type="button"
                                    onClick={handleUploadClick}
                                    className="absolute -bottom-2 -right-2 p-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 border-4 border-gray-900"
                                    aria-label="Upload or replace doctor profile image"
                                >
                                    <Upload size={18} />
                                </button>

                                {/* Hidden File Uploader */}
                                <div className="hidden">
                                    <FileUploader files={previewFiles} onChange={handleFileChange} />
                                </div>
                            </div>

                            {/* Image Instructions */}
                            <div className="flex-1 text-center lg:text-left">
                                <h3 className="text-xl font-semibold text-white mb-2 flex items-center justify-center lg:justify-start gap-2">
                                    <Camera className="text-blue-500" size={24} />
                                    Profile Photo
                                </h3>
                                <p className="text-gray-400 text-sm mb-3">
                                    Upload a professional photo of the doctor
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-gray-300">
                                        {doctor?.imageUrl || previewFiles.length > 0 ? 'Image uploaded' : 'No image selected'}
                                    </span>
                                </div>
                                {form.formState.errors.image?.message && (
                                    <p className="text-red-400 text-sm mt-3 flex items-center justify-center lg:justify-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        {String(form.formState.errors.image.message)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields Section */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-2xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-8">
                        {/* Personal Information */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/50">
                                    <User className="text-blue-500" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Personal Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <CustomFormField 
                                    fieldType={FormFieldType.INPUT} 
                                    control={form.control} 
                                    name="name" 
                                    label="Full Name" 
                                    placeholder="Dr. John Doe" 
                                />
                                <CustomFormField 
                                    fieldType={FormFieldType.INPUT} 
                                    control={form.control} 
                                    name="specialization" 
                                    label="Specialization" 
                                    placeholder="Cardiology, Neurology..." 
                                />
                                <CustomFormField 
                                    fieldType={FormFieldType.INPUT} 
                                    control={form.control} 
                                    name="experience" 
                                    label="Experience (years)" 
                                    placeholder="5" 
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 pt-6 border-t border-gray-800/50">
                                <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/50">
                                    <Mail className="text-purple-500" size={20} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">Contact Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CustomFormField 
                                    fieldType={FormFieldType.INPUT} 
                                    control={form.control} 
                                    name="email" 
                                    label="Email Address" 
                                    placeholder="doctor@example.com" 
                                />
                                <FormField 
                                    control={form.control} 
                                    name="phone" 
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-300 font-medium">Phone Number</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <PhoneInput
                                                        international
                                                        defaultCountry="IN"
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        className="input-phone w-full"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-400 text-sm" />
                                        </FormItem>
                                    )} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center sm:justify-start">
                    <div className="w-full sm:w-auto min-w-[200px]">
                        <SubmitButton isLoading={isLoading}>
                            {doctor ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Stethoscope size={18} />
                                    Update Doctor
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Stethoscope size={18} />
                                    Add Doctor
                                </span>
                            )}
                        </SubmitButton>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default DoctorForm;