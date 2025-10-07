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
import Link from "next/link";

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
    console.log("useEffect triggered:", { selectedDoctor, schedule: form.getValues("schedule") });
    if (!selectedDoctor?.availability) {
      console.log("No availability for selected doctor");
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
        console.log("Slot validation:", { slot, isValid });
        return isValid;
      })
      .flatMap(slot => {
        const [startHours, startMinutes] = slot.start.split(":").map(Number);
        const [endHours, endMinutes] = slot.end.split(":").map(Number);
        if (Number.isNaN(startHours) || Number.isNaN(startMinutes) || Number.isNaN(endHours) || Number.isNaN(endMinutes)) {
          console.warn("Invalid time format for slot:", slot);
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

    console.log("Calculated slots:", slots);
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
          router.push(
            `/patients/${patientId}/new-appointment/success?appointmentId=${newAppointment.$id}`
          );
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
          background-color: #10b981;
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
          background-color: #10b981 !important;
          color: #fff !important;
          font-weight: 600;
        }
        .custom-datepicker .react-datepicker__day--today {
          border: 1px solid #10b981;
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
          background-color: #10b981 !important;
          color: #fff !important;
        }
        .custom-datepicker .react-datepicker__time-list-item--selected {
          background-color: #10b981 !important;
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
          {type === "create" && (
            <section className="mb-12 space-y-4">
              <h1 className="header">New Appointment</h1>
              <p className="text-dark-700">Request a new appointment in 10 seconds.</p>
            </section>
          )}

          {type !== "cancel" && (
            <>
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
                      <div className="flex cursor-pointer items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300">
                          {doctor.imageUrl ? (
                            <Image
                              src={doctor.imageUrl}
                              alt={doctor.name}
                              width={30}
                              height={30}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-gray-200">{doctor.name}</p>
                          <p className="text-xs text-gray-500">{doctor.specialization}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </CustomFormField>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200 pr-2">
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
                        console.log("DatePicker onChange:", date);
                        field.onChange(date);
                      }}
                      showTimeSelect
                      includeTimes={availableSlots}
                      dateFormat="MM/dd/yyyy - h:mm aa"
                      placeholderText="Select available slot"
                      className="custom-datepicker w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      calendarClassName="custom-datepicker"
                      filterDate={(date: Date) => {
                        if (!selectedDoctor?.availability) return false;
                        const day = date.toLocaleDateString("en-US", { weekday: "long" });
                        return (selectedDoctor.availability[day] ?? []).length > 0;
                      }}
                    />
                  )}
                />
                <p className="text-xs text-gray-500">
                  Disabled dates are shown with strikethrough and reduced opacity
                </p>
              </div>

              <div className="flex flex-col gap-6 xl:flex-row">
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="reason"
                  label="Appointment reason"
                  placeholder="Annual monthly check-up"
                  disabled={type === "schedule"}
                />
                <CustomFormField
                  fieldType={FormFieldType.TEXTAREA}
                  control={form.control}
                  name="note"
                  label="Comments/notes"
                  placeholder="Prefer afternoon appointments, if possible"
                  disabled={type === "schedule"}
                />
              </div>
            </>
          )}

          {type === "cancel" && (
            <CustomFormField
              fieldType={FormFieldType.TEXTAREA}
              control={form.control}
              name="cancellationReason"
              label="Reason for cancellation"
              placeholder="Urgent meeting came up"
            />
          )}

          <SubmitButton
            isLoading={isLoading}
            className={`${type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"} w-full`}
          >
            {buttonLabel}
          </SubmitButton>
        </form>
      </Form>

      {type === "create" && patientId && (
        <Link
          href={`/appointments/${patientId}`}
          className="text-sm text-green-400 hover:text-green-300 transition-colors inline-flex items-center gap-2"
        >
          My Appointments
        </Link>
      )}
    </>
  );
};