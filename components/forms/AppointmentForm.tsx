"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useEffect, useRef, forwardRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { SelectItem } from "@/components/ui/select";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment, Doctor } from "@/types/appwrite.types";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker, { ReactDatePickerProps } from "react-datepicker";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Form } from "../ui/form";

export interface AvailabilitySlot {
  start: string;
  end: string;
}

const CustomDatePicker = forwardRef<DatePicker, Omit<ReactDatePickerProps, "selected" | "onChange"> & { value: Date | null; onChange: (date: Date | null, event?: React.SyntheticEvent<any> | undefined) => void }>(
  ({ value, onChange, ...props }, ref) => (
    <DatePicker
      {...props}
      selected={value}
      onChange={onChange}
      ref={ref}
    />
  )
);
CustomDatePicker.displayName = "CustomDatePicker";

export const AppointmentForm = ({
  userId,
  patientId,
  type = "create",
  appointment,
  setOpen,
}: {
  userId: string;
  patientId: string;
  type: "create" | "schedule" | "cancel";
  appointment?: Appointment;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const datePickerRef = useRef<DatePicker>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const AppointmentFormValidation = getAppointmentSchema(type);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment?.primaryPhysician || "",
      schedule: appointment ? new Date(appointment.schedule) : new Date(),
      reason: appointment?.reason || "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
    },
  });

  const primaryPhysician = form.watch("primaryPhysician");

  interface RawDoctor {
    $id?: string;
    name: string;
    email: string;
    phone: string;
    imageUrl?: string;
    specialization?: string;
    availability: Record<string, string[]>;
  }

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoadingDoctors(true);
        const allDoctors = await getDoctors() as unknown as RawDoctor[];
        const parsedDoctors: Doctor[] = allDoctors.map((doctor) => ({
          ...doctor,
          availability: Object.fromEntries(
            Object.entries(doctor.availability || {}).map(([day, slots]) => [
              day,
              Array.isArray(slots)
                ? slots.map((slot: string) => {
                  const [start, end] = slot.split("-");
                  return { start: start || "", end: end || "" };
                })
                : [],
            ])
          ) as Record<string, AvailabilitySlot[]>,
        }));
        setDoctors(parsedDoctors);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setIsLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (primaryPhysician) {
      const doctor = doctors.find(d => d.name === primaryPhysician);
      if (doctor) {
        setSelectedDoctor(doctor);
        form.setValue("schedule", new Date());
      }
    }
  }, [primaryPhysician, doctors, form]);

  useEffect(() => {
    if (!selectedDoctor?.availability) {
      setAvailableSlots([]);
      datePickerRef.current?.setOpen(false);
      return;
    }

    const currentDateTime = new Date();
    const selectedDate = form.getValues("schedule") || new Date();
    const dayOfWeek = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    const daySlots = (selectedDoctor.availability[dayOfWeek] ?? []) as AvailabilitySlot[];

    const isToday = selectedDate.toDateString() === currentDateTime.toDateString();

    const slots: Date[] = daySlots
      .filter((slot): slot is AvailabilitySlot => {
        const isValid = !!slot && typeof slot.start === "string" && typeof slot.end === "string" && slot.start.includes(":") && slot.end.includes(":");
        return isValid;
      })
      .flatMap(slot => {
        const [startHours, startMinutes] = slot.start.split(":").map(Number);
        const [endHours, endMinutes] = slot.end.split(":").map(Number);
        if (Number.isNaN(startHours) || Number.isNaN(startMinutes) || Number.isNaN(endHours) || Number.isNaN(endMinutes)) {
          return [];
        }
        const slotStart = new Date(selectedDate);
        slotStart.setHours(startHours, startMinutes, 0, 0);
        const slotEnd = new Date(selectedDate);
        slotEnd.setHours(endHours, endMinutes, 0, 0);

        const slotTimes: Date[] = [];
        for (let time = new Date(slotStart); time < slotEnd; time.setMinutes(time.getMinutes() + 30)) {
          const slotTime = new Date(time);
          if (!isToday || slotTime > currentDateTime) {
            slotTimes.push(slotTime);
          }
        }
        return slotTimes;
      });

    setAvailableSlots(slots);

    if (slots.length > 0) {
      setTimeout(() => {
        datePickerRef.current?.setOpen(true);
      }, 100);
    } else {
      datePickerRef.current?.setOpen(false);
    }
  }, [selectedDoctor, form.watch("schedule")]);

  const onSubmit = async (values: z.infer<typeof AppointmentFormValidation>) => {
    setIsLoading(true);

    let status: "pending" | "scheduled" | "cancelled";
    switch (type) {
      case "schedule":
        status = "scheduled";
        break;
      case "cancel":
        status = "cancelled";
        break;
      default:
        status = "pending";
    }

    try {
      if (type === "create") {
        const newAppointment = await createAppointment({
          userId,
          patient: patientId,
          primaryPhysician: values.primaryPhysician,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          status,
          note: values.note,
          patientId,
        });

        if (newAppointment) {
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          router.push(`/patients/${patientId}/new-appointment/success?appointmentId=${newAppointment.$id}`);
        }
      } else if (appointment) {
        const updatedAppointment = await updateAppointment({
          userId,
          appointmentId: appointment.$id,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment: {
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            status,
            cancellationReason: values.cancellationReason,
          },
          type,
        });

        if (updatedAppointment) {
          setOpen?.(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      }
    } catch (error) {
      console.error("Appointment form error:", error);
    }

    setIsLoading(false);
  };

  const handleViewAppointments = () => {
    setIsRedirecting(true);
    router.push(`/appointments/${patientId}`);
  };

  const buttonLabel =
    type === "cancel"
      ? "Cancel Appointment"
      : type === "schedule"
        ? "Schedule Appointment"
        : "Submit Appointment";

  return (
    <>
      <style jsx global>{`
        .custom-datepicker {
          font-family: inherit;
        }
        .custom-datepicker .react-datepicker {
          background-color: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          z-index: 1000;
        }
        .custom-datepicker .react-datepicker__header {
          background-color: #262626;
          border-bottom: 1px solid #333;
        }
        .custom-datepicker .react-datepicker__current-month,
        .custom-datepicker .react-datepicker__time__header {
          color: #fff;
          font-weight: 600;
        }
        .custom-datepicker .react-datepicker__day-name {
          color: #9ca3af;
        }
        .custom-datepicker .react-datepicker__navigation {
          top: 10px;
        }
        .custom-datepicker .react-datepicker__navigation-icon::before {
          border-color: #9ca3af;
        }
        .custom-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #fff;
        }
        .custom-datepicker .react-datepicker__day {
          color: #fff;
          background-color: transparent;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .custom-datepicker .react-datepicker__day:hover {
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          color: #fff;
        }
        .custom-datepicker .react-datepicker__day--disabled {
          color: #4b5563 !important;
          background-color: transparent !important;
          cursor: not-allowed !important;
          text-decoration: line-through;
          opacity: 0.4;
        }
        .custom-datepicker .react-datepicker__day--disabled:hover {
          background-color: transparent !important;
          color: #4b5563 !important;
        }
        .custom-datepicker .react-datepicker__day--selected,
        .custom-datepicker .react-datepicker__day--keyboard-selected {
          background: linear-gradient(to right, #3b82f6, #8b5cf6) !important;
          color: #fff !important;
          font-weight: 600;
        }
        .custom-datepicker .react-datepicker__day--today {
          border: 1px solid #8b5cf6;
          font-weight: 600;
        }
        .custom-datepicker .react-datepicker__day--outside-month {
          color: #374151;
          opacity: 0.3;
        }
        .custom-datepicker .react-datepicker__time-container {
          border-left: 1px solid #333;
        }
        .custom-datepicker .react-datepicker__time {
          background-color: #1a1a1a;
        }
        .custom-datepicker .react-datepicker__time-box {
          width: 100%;
        }
        .custom-datepicker .react-datepicker__time-list-item {
          color: #fff;
          transition: all 0.2s ease;
        }
        .custom-datepicker .react-datepicker__time-list-item:hover {
          background: linear-gradient(to right, #3b82f6, #8b5cf6) !important;
          color: #fff !important;
        }
        .custom-datepicker .react-datepicker__time-list-item--selected {
          background: linear-gradient(to right, #3b82f6, #8b5cf6) !important;
          color: #fff !important;
          font-weight: 600;
        }
        .custom-datepicker .react-datepicker__time-list-item--disabled {
          color: #4b5563 !important;
          background-color: transparent !important;
          text-decoration: line-through;
          opacity: 0.4;
        }
        .custom-datepicker .react-datepicker__time-list-item--disabled:hover {
          background-color: transparent !important;
          cursor: not-allowed !important;
        }
        @media (min-width: 768px) {
          .custom-datepicker .react-datepicker {
            width: 350px;
          }
          .custom-datepicker .react-datepicker__time-container {
            width: 100px;
          }
        }
      `}</style>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-8">
          {type === "create" && (
            <section className="space-y-4">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl -z-10" />

                <div className="relative space-y-3">
                  {/* Title with Icon */}
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30 backdrop-blur-sm">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                      New Appointment
                    </h1>
                  </div>

                  {/* Subtitle */}
                  <p className="text-gray-400 text-base md:text-lg ml-0 md:ml-14">
                    Request a new appointment in 10 seconds
                  </p>
                </div>
              </div>
            </section>
          )}

          {type !== "cancel" && (
            <div className="space-y-6">
              {/* Doctor Selection */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <CustomFormField
                    fieldType={FormFieldType.SELECT}
                    control={form.control}
                    name="primaryPhysician"
                    label="Doctor"
                    placeholder="Select a doctor"
                  >
                    {isLoadingDoctors ? (
                      <SelectItem value="loading" disabled>
                        Loading doctors...
                      </SelectItem>
                    ) : (
                      doctors.map((doctor, i) => (
                        <SelectItem
                          key={doctor.$id || doctor.name + i}
                          value={doctor.name}
                        >
                          <div className="flex cursor-pointer items-center gap-3 py-1">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                              {doctor.imageUrl ? (
                                <Image
                                  src={doctor.imageUrl}
                                  alt={doctor.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-400 text-xs font-semibold">
                                  {doctor.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold text-gray-100">{doctor.name}</p>
                              <p className="text-xs text-gray-400">{doctor.specialization}</p>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </CustomFormField>
                </div>
              </div>

              {/* Date & Time Selection */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative space-y-2">
                  <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    Select Date & Time
                  </label>
                  <Controller
                    control={form.control}
                    name="schedule"
                    render={({ field }) => (
                      <CustomDatePicker
                        key={selectedDoctor?.$id || "no-doctor"}
                        ref={datePickerRef}
                        value={field.value as any}
                        onChange={(date: Date | null, event?: React.SyntheticEvent<any> | undefined) => {
                          field.onChange(date);
                        }}
                        showTimeSelect
                        includeTimes={availableSlots}
                        dateFormat="MM/dd/yyyy - h:mm aa"
                        placeholderText="Select available slot"
                        className="custom-datepicker w-full px-4 py-3 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-600"
                        calendarClassName="custom-datepicker"
                        filterDate={(date: Date) => {
                          if (!selectedDoctor?.availability) return false;
                          const day = date.toLocaleDateString("en-US", { weekday: "long" });
                          return (selectedDoctor.availability[day] ?? []).length > 0;
                        }}
                      />
                    )}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Disabled dates are shown with strikethrough
                  </p>
                </div>
              </div>

              {/* Reason and Notes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <CustomFormField
                      fieldType={FormFieldType.TEXTAREA}
                      control={form.control}
                      name="reason"
                      label="Appointment reason"
                      placeholder="Annual monthly check-up"
                      disabled={type === "schedule"}
                    />
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <CustomFormField
                      fieldType={FormFieldType.TEXTAREA}
                      control={form.control}
                      name="note"
                      label="Comments/notes"
                      placeholder="Prefer afternoon appointments, if possible"
                      disabled={type === "schedule"}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "cancel" && (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-orange-600/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="cancellationReason"
                  label="Reason for cancellation"
                  placeholder="Urgent meeting came up"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="relative pt-2">
            <div className={`absolute inset-0 ${type === "cancel" ? "bg-gradient-to-r from-red-600/20 to-orange-600/20" : "bg-gradient-to-r from-blue-600/20 to-purple-600/20"} rounded-xl blur-xl opacity-70`} />
            <div className="relative">
              <SubmitButton
                isLoading={isLoading}
                className={`${type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"} w-full`}
              >
                <span className="flex items-center justify-center gap-2">
                  {buttonLabel}
                  {type !== "cancel" && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </span>
              </SubmitButton>
            </div>
          </div>
        </form>
      </Form>

      {type === "create" && patientId && (
        <div className="mt-6 w-full flex justify-start md:justify-left">
          <button
            onClick={handleViewAppointments}
            disabled={isRedirecting}
            className={`group relative flex items-center justify-center w-full md:w-auto gap-2 md:gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-blue-500/50 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 ${isRedirecting ? "opacity-70 cursor-not-allowed" : ""
              }`}
          >
            {isRedirecting ? (
              <span className="flex items-center gap-2 flex-nowrap">
                <svg
                  className="w-5 h-5 animate-spin text-blue-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  ></path>
                </svg>
                <span className="font-medium text-sm md:text-base">Loading My Appointments</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 flex-nowrap font-medium text-sm md:text-base">
                View My Appointments
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            )}
          </button>
        </div>

      )}
    </>
  );
};