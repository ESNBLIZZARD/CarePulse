"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/table/DataTable";
import { Appointment, Doctor } from "@/types/appwrite.types";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { columns } from "@/components/table/columns";
import { RefreshCw, Search, Filter, RotateCcw } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/DateRangePicker";

const AdminPage = () => {
  const [appointmentsData, setAppointmentsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "scheduled" | "pending" | "cancelled" | "completed"
  >("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchAppointments = async (isTableReload = false) => {
    try {
      if (isTableReload) setTableLoading(true);
      else setLoading(true);

      const backendStatus = statusFilter === "all" ? undefined : statusFilter;

      const data = await getRecentAppointmentList({
        search: debouncedSearch,
        status: backendStatus,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      });

      setAppointmentsData(data || null);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      if (isTableReload) setTableLoading(false);
      else setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Reload table when filters/search/dateRange change
  useEffect(() => {
    if (!loading) fetchAppointments(true);
  }, [debouncedSearch, statusFilter, dateRange]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const backendStatus = statusFilter === "all" ? undefined : statusFilter;
      const data = await getRecentAppointmentList({
        search: debouncedSearch,
        status: backendStatus,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      });
      setAppointmentsData(data || null);
    } catch (error) {
      console.error("Failed to refresh appointments:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange(undefined);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen text-white">
        <AdminHeader />
        <div className="space-y-8 mt-8">
          <div className="h-10 w-1/3 bg-gray-800/50 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-gray-800/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-800/50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-8 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen text-white p-4 md:p-8">
      <AdminHeader />

      <main className="space-y-8">
        {/* Welcome Section */}
        <section className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Welcome Admin! 👋</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Manage appointments and track daily operations
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            type="appointments"
            count={appointmentsData?.scheduledCount || 0}
            label="Scheduled appointments"
            icon="/assets/icons/appointments.svg"
          />
          <StatCard
            type="pending"
            count={appointmentsData?.pendingCount || 0}
            label="Pending appointments"
            icon="/assets/icons/pending.svg"
          />
          <StatCard
            type="cancelled"
            count={appointmentsData?.cancelledCount || 0}
            label="Cancelled appointments"
            icon="/assets/icons/cancelled.svg"
          />
          <StatCard
            type="completed"
            count={appointmentsData?.completedCount || 0}
            label="Completed appointments"
            icon="/assets/icons/completed.svg"
          />
        </section>

        {/* Filters Section */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-white">Filters</h2>
            </div>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search patient or doctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25rem',
                paddingRight: '2.5rem',
              }}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date Range Picker */}
            <div className="w-full md:w-auto">
              <DateRangePicker date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </section>

        {/* Table Section */}
        <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
          {tableLoading ? (
            <div className="divide-y divide-gray-800">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-800/30 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <DataTable<Appointment & { doctor: Doctor }, unknown>
              columns={columns}
              data={
                appointmentsData?.documents?.length > 0
                  ? appointmentsData?.documents
                  : [
                      {
                        id: "empty",
                        patient: { name: "No appointments found" },
                        doctor: { name: "" },
                        status: "",
                        date: "",
                        time: "",
                      } as any,
                    ]
              }
            />
          )}
        </section>
      </main>

      {/* Refresh Button */}
      <div className="flex justify-start pb-4">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={refreshing}
        >
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
