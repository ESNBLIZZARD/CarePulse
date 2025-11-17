"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Appointment, Doctor } from "@/types/appwrite.types";
import {
  ArrowLeft,
  CalendarDays,
  MessageSquare,
  Search,
  Filter,
  X,
  Calendar,
  User
} from "lucide-react";
import { ViewReportsModal } from "./ViewReportModal";

interface AppointmentListProps {
  appointments: Appointment[];
  patients?: Record<string, { name: string }>;
  doctors: Doctor[];
}

export default function AppointmentList({
  appointments,
  patients = {},
  doctors = [],
}: AppointmentListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/30";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/30";
      case "completed":
        return "bg-green-500/10 text-green-400 border border-green-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return "📅";
      case "pending":
        return "⏳";
      case "cancelled":
        return "❌";
      case "completed":
        return "✔";
      default:
        return "📋";
    }
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const doctorInfo = doctors.find((doc) => {
        if (doc.$id && doc.$id === appointment.primaryPhysician) return true;
        if (
          doc.name.trim().toLowerCase() ===
          appointment.primaryPhysician?.trim().toLowerCase()
        )
          return true;
        return false;
      });

      const doctorName = doctorInfo?.name || appointment.primaryPhysician || "";
      // Search filter
      const matchesSearch =
        doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
      // Status filter
      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;
      // Date filter
      const matchesDate = !dateFilter ||
        appointment.schedule.toString().startsWith(dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, doctors, searchTerm, statusFilter, dateFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter("");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || dateFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-300 to-dark-400 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-dark-300 text-white hover:bg-dark-400 hover:scale-105 transition-all duration-200 border border-gray-700/50 shadow-lg flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>

          <h1 className="text-lg sm:text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 truncate">
            My Appointments
          </h1>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-2 rounded-xl bg-dark-300 text-white hover:bg-dark-400 transition-all duration-200 border border-gray-700/50 relative flex-shrink-0"
            aria-label="Toggle filters"
          >
            <Filter size={18} />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Filters Section */}
        <div className={`${showFilters ? 'block' : 'hidden md:block'} bg-dark-300/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-xl space-y-3 sm:space-y-4`}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-300 flex items-center gap-2">
              <Filter size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" />
              <span className="hidden sm:inline">Filters</span>
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <X size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clear all</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 text-sm bg-dark-400 border border-gray-700 rounded-lg sm:rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 text-sm bg-dark-400 border border-gray-700 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 sm:py-3 text-sm bg-dark-400 border border-gray-700 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between px-1 sm:px-2">
          <p className="text-gray-400 text-xs sm:text-sm">
            Showing <span className="text-white font-semibold">{filteredAppointments.length}</span> of{" "}
            <span className="text-white font-semibold">{appointments.length}</span> appointments
          </p>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <ul className="space-y-3 sm:space-y-4">
            {filteredAppointments.map((appointment) => {
              const doctorInfo = doctors.find((doc) => {
                if (doc.$id && doc.$id === appointment.primaryPhysician) return true;
                if (
                  doc.name.trim().toLowerCase() ===
                  appointment.primaryPhysician?.trim().toLowerCase()
                )
                  return true;
                return false;
              });

              const patientId =
                typeof appointment.patientId === "object"
                  ? appointment.patientId.$id
                  : appointment.patientId;

              const patientName = patients[patientId]?.name || "Unknown Patient";

              const { dateTime } = formatDateTime(appointment.schedule);

              return (
                <li
                  key={appointment?.$id}
                  className="group p-3 sm:p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-dark-300 to-dark-400 border border-gray-700/50 hover:border-blue-500/30"
                >
                  {/* Header: Patient + Status */}
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg text-sm sm:text-base flex-shrink-0">
                        {patientName.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-white truncate">
                        {patientName}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(
                        appointment?.status
                      )} flex items-center gap-1.5 shadow-md flex-shrink-0`}
                    >
                      <span className="text-sm sm:text-base">{getStatusIcon(appointment?.status)}</span>
                      <span className="inline">
                        {appointment?.status.charAt(0).toUpperCase() +
                          appointment?.status.slice(1)}
                      </span>
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-3 p-2.5 sm:p-3 bg-dark-200/50 rounded-lg border border-gray-700/30">
                    {doctorInfo?.imageUrl ? (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-blue-500/40 shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Image
                          src={doctorInfo.imageUrl}
                          alt={doctorInfo.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-semibold shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        {appointment.primaryPhysician?.charAt(0) || doctorInfo?.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                        Attending Doctor
                      </p>
                      <p className="font-semibold text-white text-sm sm:text-lg truncate">
                        Dr. {doctorInfo?.name || appointment.primaryPhysician || "Not specified"}
                      </p>
                      {doctorInfo?.specialization && (
                        <p className="text-xs sm:text-sm text-blue-400 mt-0.5 sm:mt-1 truncate">
                          {doctorInfo.specialization}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="space-y-2 sm:space-y-2.5 bg-dark-200/30 p-2.5 sm:p-3 rounded-lg border border-gray-700/20">
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <CalendarDays size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Date & Time
                        </p>
                        <p className="text-white font-medium text-sm sm:text-base">{dateTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px] text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                          Reason for Visit
                        </p>
                        <p className="text-gray-300 text-sm sm:text-base break-words">
                          {appointment.reason || "No reason provided"}
                        </p>
                      </div>
                    </div>
                    {appointment.reports && appointment.reports.length > 0 ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mt-3 sm:mt-4 pt-3 border-t border-gray-700/30">
                        <p className="text-xs sm:text-sm text-gray-400">
                          📄 {appointment.reports.length} report
                          {appointment.reports.length > 1 ? "s" : ""} uploaded
                        </p>
                        <ViewReportsModal appointment={appointment} />
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 italic">
                        No reports uploaded yet
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-dark-300 rounded-full flex items-center justify-center mb-4 sm:mb-6 border border-gray-700/50">
              <Search size={32} className="sm:w-10 sm:h-10 text-gray-500" />
            </div>
            <p className="text-gray-400 text-base sm:text-lg font-medium mb-2 text-center">No appointments found</p>
            <p className="text-gray-500 text-xs sm:text-sm text-center max-w-md px-4">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "You don't have any appointments scheduled yet"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 sm:mt-6 px-5 sm:px-6 py-2 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}