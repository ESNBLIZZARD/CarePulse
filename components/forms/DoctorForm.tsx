"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import CustomFormField, { FormFieldType } from "../CustomFormField"
import SubmitButton from "../SubmitButton"
import { FileUploader } from "../FileUploader"
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form"
import { createDoctor, updateDoctor } from "@/lib/actions/doctor.actions"
import type { Doctor } from "@/types/appwrite.types"
import { Camera, Upload, Stethoscope, User, Clock, Trash2, Plus, Contact } from "lucide-react"
import "react-datepicker/dist/react-datepicker.css"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const DoctorFormValidation = z.object({
    name: z.string().min(2, "Name is required"),
    specialization: z.string().optional(),
    experience: z.preprocess((val) => (val ? Number(val) : undefined), z.number().min(0).optional()),
    email: z.string().email("Invalid email").optional(),
    phone: z
        .string()
        .refine((val) => !val || val.startsWith("+"), {
            message: "Phone number must be in international format (e.g., +919876543210)",
        })
        .optional(),
    image: z.any().optional(),
    availability: z.record(z.array(z.object({ start: z.string(), end: z.string() }))).optional(),
})

interface DoctorFormProps {
    doctor?: Doctor
    onSuccess?: () => void
}

const DoctorForm = ({ doctor, onSuccess }: DoctorFormProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [previewFiles, setPreviewFiles] = useState<File[]>([])
    const [isDragging, setIsDragging] = useState(false)

    const form = useForm<z.infer<typeof DoctorFormValidation>>({
        resolver: zodResolver(DoctorFormValidation),
        defaultValues: {
            name: "",
            specialization: "",
            experience: undefined,
            email: "",
            phone: "",
            image: [],
            availability: daysOfWeek.reduce(
                (acc, day) => ({ ...acc, [day]: [] }),
                {} as Record<string, { start: string; end: string }[]>,
            ),
        },
    })

    // Parse availability from string format to object format
    const parseAvailability = (availability: any) => {
        if (!availability) {
            return daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: [] }), {})
        }

        const parsed: Record<string, { start: string; end: string }[]> = {}

        Object.entries(availability).forEach(([day, slots]) => {
            if (Array.isArray(slots)) {
                parsed[day] = slots.map((timeRange: any) => {
                    if (typeof timeRange === "string") {
                        const [start, end] = timeRange.split("-")
                        return { start: start || "", end: end || "" }
                    }
                    return timeRange
                })
            } else {
                parsed[day] = []
            }
        })

        return parsed
    }

    // Prefill form if editing
    useEffect(() => {
        if (doctor) {
            const parsedAvailability = parseAvailability(doctor.availability)

            form.reset({
                name: doctor.name || "",
                specialization: doctor.specialization || "",
                experience: doctor.experience ?? undefined,
                email: doctor.email || "",
                phone: doctor.phone || "",
                image: [],
                availability: parsedAvailability,
            })
            if (doctor.imageUrl) setPreviewFiles([])
        }
    }, [doctor, form])

    const onSubmit = async (values: z.infer<typeof DoctorFormValidation>) => {
        setIsLoading(true)
        try {
            // Convert availability to string array format for database
            const formattedAvailability = Object.fromEntries(
                Object.entries(values.availability || {}).map(([day, slots]) => [
                    day,
                    slots.map((slot) => `${slot.start}-${slot.end}`),
                ]),
            )

            const doctorData: any = {
                name: values.name,
                specialization: values.specialization,
                experience: values.experience,
                email: values.email,
                phone: values.phone || "",
                availability: formattedAvailability,
            }

            // Handle image
            if (values.image && values.image.length > 0) {
                const file = values.image[0]
                if (file instanceof File) {
                    const formData = new FormData()
                    formData.append("blobFile", file)
                    formData.append("fileName", file.name)
                    doctorData.image = formData
                }
            }

            if (doctor?.$id) {
                await updateDoctor(doctor.$id, doctorData)
            } else {
                await createDoctor(doctorData as Doctor & { image?: FormData })
            }

            form.reset()
            setPreviewFiles([])
            if (onSuccess) onSuccess()
        } catch (error) {
            console.error("Error saving doctor:", error)
            form.setError("image", { message: "Failed to upload image. Check file type or size." })
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (files: File[]) => {
        form.setValue("image", files)
        setPreviewFiles(files)
    }

    const handleUploadClick = () => {
        const input = document.querySelector(".file-upload input[type='file']") as HTMLInputElement
        if (input) input.click()
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                {/* Profile Image Section */}
                <div className="relative p-2 sm:p-4">
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-lg sm:rounded-xl p-2 sm:p-4">
                        <div className="flex flex-col items-center gap-4 sm:gap-6">
                            <div className="relative group w-full max-w-[150px] sm:max-w-[200px]">
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition-opacity duration-300" />
                                    <div
                                        className={`relative w-full h-full aspect-square rounded-full overflow-hidden border-4 border-gray-900 shadow-2xl transition-transform duration-300 ${isDragging ? "scale-105" : "group-hover:scale-105"}`}
                                        onDragEnter={() => setIsDragging(true)}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={() => setIsDragging(false)}
                                    >
                                        {doctor?.imageUrl && !previewFiles.length ? (
                                            <img
                                                src={doctor.imageUrl || "/placeholder.svg"}
                                                alt={doctor.name || "Doctor profile"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : previewFiles.length > 0 ? (
                                            <img
                                                src={URL.createObjectURL(previewFiles[0]) || "/placeholder.svg"}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                                                <User size={32} className="text-gray-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUploadClick}
                                    className="absolute bottom-0 right-1/2 translate-x-8 sm:translate-x-12 p-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300 border-4 border-gray-900"
                                    aria-label="Upload or replace doctor profile image"
                                >
                                    <Upload size={12} />
                                </button>
                                <div className="hidden">
                                    <FileUploader files={previewFiles} onChange={handleFileChange} />
                                </div>
                            </div>
                            <div className="w-full text-center">
                                <h3 className="text-sm sm:text-lg font-semibold text-white mb-1 flex items-center justify-center gap-2">
                                    <Camera className="text-blue-500" size={16} />
                                    Profile Photo
                                </h3>
                                <p className="text-gray-400 text-xs mb-2 px-2">Upload a professional photo of the doctor</p>
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800/50 border border-gray-700/50">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs text-gray-300">
                                        {doctor?.imageUrl || previewFiles.length > 0 ? "Image uploaded" : "No image selected"}
                                    </span>
                                </div>
                                {form.formState.errors.image?.message && (
                                    <p className="text-red-400 text-xs mt-2 flex items-center justify-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        {String(form.formState.errors.image.message)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal & Contact Information */}
                 <div className="pt-4 sm:pt-6 border-t border-gray-800/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30">
                        <Contact className="text-blue-400" size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-white">Contact Information</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Set personal information for doctors...</p>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl sm:rounded-2xl blur-xl sm:blur-2xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                            <CustomFormField
                                fieldType={FormFieldType.INPUT}
                                control={form.control}
                                name="email"
                                label="Email Address"
                                placeholder="doctor@example.com"
                            />
                            <Controller
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 font-medium text-sm">Phone Number</FormLabel>
                                        <FormControl>
                                            <div className="w-full min-w-0">
                                                <PhoneInput
                                                    international
                                                    defaultCountry="IN"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="input-phone w-full"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-red-400 text-xs sm:text-sm" />
                                    </FormItem>
                                )}
                            />
                            </div>
                        </div>

                        {/* Availability Section */}
                        <div className="pt-4 sm:pt-6 border-t border-gray-800/50">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30">
                                    <Stethoscope className="text-blue-400" size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-semibold text-white">Weekly Schedule</h3>
                                    <p className="text-xs sm:text-sm text-gray-400">Set available time slots for each day</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                                {daysOfWeek.map((day) => (
                                    <Controller
                                        key={day}
                                        name={`availability.${day}` as const}
                                        control={form.control}
                                        render={({ field }) => {
                                            const slots: { start: string; end: string }[] = Array.isArray(field.value) ? field.value : []

                                            return (
                                                <div className="bg-gray-800/40 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors min-w-0 w-full overflow-hidden">
                                                    <FormItem>
                                                        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                                                            <FormLabel className="text-white font-semibold text-sm flex items-center gap-1.5 flex-shrink-0">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                                {day}
                                                            </FormLabel>
                                                            {slots.length > 0 && (
                                                                <span className="text-[10px] text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                                                                    {slots.length} {slots.length === 1 ? "slot" : "slots"}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <FormControl>
                                                            <div className="space-y-2">
                                                                {slots.length === 0 ? (
                                                                    <div className="text-center py-4 sm:py-6 text-gray-500 text-xs border border-dashed border-gray-700 rounded-lg">
                                                                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                                                                        <p>No slots added</p>
                                                                    </div>
                                                                ) : (
                                                                    slots.map((slot, index) => (
                                                                        <div
                                                                            key={index}
                                                                            className="w-full flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 bg-gray-900/50 p-2 rounded-lg border border-gray-700/50 min-w-0"
                                                                        >
                                                                            <input
                                                                                type="time"
                                                                                value={slot.start}
                                                                                onChange={(e) => {
                                                                                    const newSlots = [...slots]
                                                                                    newSlots[index].start = e.target.value
                                                                                    field.onChange(newSlots)
                                                                                }}
                                                                                className="w-full sm:flex-1 sm:w-auto min-w-0 rounded px-2 py-2 sm:py-1 bg-gray-800 border border-gray-600 text-white text-sm sm:text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                            />
                                                                            <span className="hidden sm:inline text-gray-500 text-xs flex-shrink-0">→</span>
                                                                            <input
                                                                                type="time"
                                                                                value={slot.end}
                                                                                onChange={(e) => {
                                                                                    const newSlots = [...slots]
                                                                                    newSlots[index].end = e.target.value
                                                                                    field.onChange(newSlots)
                                                                                }}
                                                                                className="w-full sm:flex-1 sm:w-auto min-w-0 rounded px-2 py-2 sm:py-1 bg-gray-800 border border-gray-600 text-white text-sm sm:text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                className="w-full sm:w-auto flex items-center justify-center sm:justify-center gap-1.5 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                                                                                onClick={() => {
                                                                                    const newSlots = slots.filter((_, i) => i !== index)
                                                                                    field.onChange(newSlots)
                                                                                }}
                                                                                aria-label="Remove time slot"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5 sm:mr-0" />
                                                                                <span className="sm:hidden text-xs">Remove</span>
                                                                            </button>
                                                                        </div>
                                                                    ))
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-green-600/10 to-emerald-600/10 hover:from-green-600/20 hover:to-emerald-600/20 text-green-400 hover:text-green-300 transition-all duration-200 border border-green-600/20 hover:border-green-600/30 text-xs font-medium"
                                                                    onClick={() => field.onChange([...slots, { start: "09:00", end: "17:00" }])}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                    Add Time Slot
                                                                </button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-400 text-xs mt-1" />
                                                    </FormItem>
                                                </div>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center">
                    <div className="w-full sm:w-auto sm:min-w-[200px]">
                        <SubmitButton isLoading={isLoading}>
                            <span className="flex items-center justify-center gap-1 text-sm">
                                <Stethoscope size={16} />
                                {doctor ? "Update Doctor" : "Add Doctor"}
                            </span>
                        </SubmitButton>
                    </div>
                </div>
            </form>
        </Form>
    )
}

export default DoctorForm
