"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { SelectItem } from "@/components/ui/select";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { createAppointment, updateAppointment } from "@/lib/actions/appointment.actions";
import { getAppointmentSchema } from "@/lib/validation";
import { Appointment, Doctor } from "@/types/appwrite.types";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { Form } from "../ui/form";
import Link from "next/link";

export interface AvailabilitySlot {
  start: string;
  end: string;
}

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
  const datePickerRef = useRef<any>(null);

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

  // Define raw doctor type to match database format
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

  // Update available slots and open DatePicker when doctor or schedule changes
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

    // Check if selected date is today
    const isToday = selectedDate.toDateString() === currentDateTime.toDateString();

    const slots: Date[] = daySlots
      .filter((slot): slot is AvailabilitySlot => !!slot && typeof slot.start === "string" && typeof slot.end === "string" && slot.start.includes(":") && slot.end.includes(":"))
      .flatMap(slot => {
        const [startHours, startMinutes] = slot.start.split(":").map(Number);
        const [endHours, endMinutes] = slot.end.split(":").map(Number);
        const slotStart = new Date(selectedDate);
        slotStart.setHours(Number.isNaN(startHours) ? 0 : startHours, Number.isNaN(startMinutes) ? 0 : startMinutes, 0, 0);
        const slotEnd = new Date(selectedDate);
        slotEnd.setHours(Number.isNaN(endHours) ? 0 : endHours, Number.isNaN(endMinutes) ? 0 : endMinutes, 0, 0);

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

    // Open DatePicker if there are available slots
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
        /* Custom DatePicker Styles */
        .custom-datepicker {
          font-family: inherit;
        }
        
        /* Calendar container */
        .custom-datepicker .react-datepicker {
          background-color: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        
        /* Header */
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
        
        /* Navigation arrows */
        .custom-datepicker .react-datepicker__navigation {
          top: 10px;
        }
        
        .custom-datepicker .react-datepicker__navigation-icon::before {
          border-color: #9ca3af;
        }
        
        .custom-datepicker .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #fff;
        }
        
        /* Active/Available days */
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
        
        /* Disabled days - clearly differentiated */
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
        
        /* Selected day */
        .custom-datepicker .react-datepicker__day--selected,
        .custom-datepicker .react-datepicker__day--keyboard-selected {
          background-color: #10b981 !important;
          color: #fff !important;
          font-weight: 600;
        }
        
        /* Today's date */
        .custom-datepicker .react-datepicker__day--today {
          border: 1px solid #10b981;
          font-weight: 600;
        }
        
        /* Outside month days */
        .custom-datepicker .react-datepicker__day--outside-month {
          color: #374151;
          opacity: 0.3;
        }
        
        /* Time selection */
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
              {/* Doctor Selection */}
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
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        form.setValue("primaryPhysician", doctor.name);
                        form.setValue("schedule", new Date());
                      }}
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

              {/* Appointment Schedule */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200 pr-2">
                  Select Date & Time
                </label>
                <Controller
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <DatePicker
                      key={selectedDoctor?.$id || "no-doctor"} 
                      ref={datePickerRef}
                      selected={field.value}
                      onChange={(date: Date | null) => date && field.onChange(date)}
                      showTimeSelect
                      includeTimes={availableSlots}
                      dateFormat="MM/dd/yyyy - h:mm aa"
                      placeholderText="Select available slot"
                      className="custom-datepicker w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      calendarClassName="custom-datepicker"
                      filterDate={(date) => {
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