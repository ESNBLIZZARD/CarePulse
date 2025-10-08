"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import AdminHeader from "@/components/AdminHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { TrendingUp, Users, Calendar, BarChart3, Filter, RotateCcw, XCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/DateRangePicker";


interface AdminAnalytics {
    totalAppointments: number,
    totalCancellations: number,
    pending: number,
    scheduled: number,
    completed: number,
    doctorStats: Array<{
        doctor: string;
        appointments: number;
        cancellations: number;
        pending: number;
        scheduled: number;
        completed: number;
    }>
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [doctors, setDoctors] = useState<{ $id: string; name: string }[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
    const [loading, setLoading] = useState<boolean>(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>();

    // Fetch doctors
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const doctorList = await getDoctors();
                setDoctors(
                    doctorList.map((doc) => ({
                        $id: doc.$id || "",
                        name: doc.name,
                    }))
                );

            } catch (error) {
                console.error("Failed to fetch doctors:", error);
            }
        };
        fetchDoctors();
    }, []);

    // Fetch analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedDoctor !== "all") params.append("doctor", selectedDoctor);
                if (appliedDateRange?.from && appliedDateRange?.to) {
                    params.append("startDate", format(appliedDateRange.from, "yyyy-MM-dd"));
                    params.append("endDate", format(appliedDateRange.to, "yyyy-MM-dd"));
                }
                const res = await fetch(`/api/analytics?${params.toString()}`);
                const data = await res.json();
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
            setLoading(false);
        };

        // Fetch if no date range is set, or after applying a date range
        if (!appliedDateRange || (appliedDateRange.from && appliedDateRange.to)) {
            fetchAnalytics();
        }
    }, [selectedDoctor, appliedDateRange]);

    // Custom Tooltip for Chart
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-xl">
                    <p className="text-white font-semibold mb-2">{data.doctor}</p>
                    <div className="space-y-1">
                        <p className="text-blue-400 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Appointments: {data.appointments}
                        </p>
                        <p className="text-red-400 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            Cancellations: {data.cancellations}
                        </p>
                        <p className="text-yellow-400 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                            Pending: {data.pending}
                        </p>
                        <p className="text-blue-300 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-300"></span>
                            Scheduled: {data.scheduled}
                        </p>
                        <p className="text-green-400 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-400"></span>
                            Completed: {data.completed}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Loading skeleton component
    const LoadingSkeleton = () => (
        <div className="animate-pulse space-y-8">
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                            <div className="h-4 bg-gray-700 rounded w-24 mb-3"></div>
                            <div className="h-8 bg-gray-700 rounded w-16"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                    <div className="h-6 bg-gray-700 rounded w-48 mb-6"></div>
                    <div className="h-80 bg-gray-800 rounded-xl flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <BarChart3 className="text-gray-600 animate-pulse" size={48} />
                            <p className="text-gray-500 text-sm">Loading analytics data...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const completedRate =
        analytics && analytics.totalAppointments > 0
            ? ((analytics.completed / analytics.totalAppointments) * 100).toFixed(1)
            : "0";

    const cancellationRate =
        analytics && analytics.totalAppointments > 0
            ? ((analytics.totalCancellations / analytics.totalAppointments) * 100).toFixed(1)
            : "0";

    return (
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen text-white p-4 md:p-8">
            <AdminHeader />

            <main className="space-y-8 mt-8">
                {/* Header */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30">
                                <BarChart3 className="text-blue-500" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white">Analytics Dashboard</h2>
                                <p className="text-gray-400 mt-1 text-sm sm:text-base">Monitor performance and insights</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <section className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="text-blue-500" size={20} />
                            <h2 className="text-lg font-semibold text-white">Filters</h2>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedDoctor("all");
                                setDateRange(undefined);
                                setAppliedDateRange(undefined);
                            }}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <RotateCcw size={16} />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Doctor Filter */}
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-400 text-sm font-medium">Doctor</label>
                            <select
                                value={selectedDoctor}
                                onChange={(e) => setSelectedDoctor(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all appearance-none"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.75rem center',
                                    backgroundSize: '1.25rem',
                                    paddingRight: '2.5rem',
                                }}
                            >
                                <option value="all">All Doctors</option>
                                {doctors.map((doc) => (
                                    <option key={doc.$id} value={doc.name}>
                                        {doc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="flex flex-col gap-2">
                            <label className="text-gray-400 text-sm font-medium">Date Range</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <DateRangePicker date={dateRange} setDate={setDateRange} />
                                </div>
                                <button
                                    onClick={() => setAppliedDateRange(dateRange)}
                                    className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-blue-500/30 transition-all whitespace-nowrap"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <LoadingSkeleton />
                ) : analytics ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Total Doctors */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Users className="text-purple-500" size={20} />
                                        <h3 className="text-gray-400 text-sm font-medium">Total Doctors</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{doctors.length}</p>
                                </div>
                            </div>

                            {/* Total Appointments */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="text-blue-500" size={20} />
                                        <h3 className="text-gray-400 text-sm font-medium">Appointments</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{analytics.totalAppointments}</p>
                                </div>
                            </div>

                            {/* Total Cancellations */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-orange-600/5 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <XCircle className="text-red-500" size={20} />
                                        <h3 className="text-gray-400 text-sm font-medium">Cancellations</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        {analytics.totalCancellations}
                                        <span className="text-lg text-gray-400 ml-2">({cancellationRate}%)</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* New Row: Pending, Scheduled, Completed */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                            {/* Pending */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-yellow-500/10 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="text-yellow-400" size={20} />
                                        <h3 className="text-gray-400 text-sm font-medium">Pending</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{analytics.pending}</p>
                                </div>
                            </div>

                            {/* Scheduled */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-500/10 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="text-blue-500" size={20} />
                                        <h3 className="text-gray-400 text-sm font-medium">Scheduled</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">{analytics.scheduled}</p>
                                </div>
                            </div>

                            {/* Completed */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-green-500/10 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 transition-all hover:border-gray-700">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Calendar className="text-green-400" size={20} />
                                        <h3 className="text-gray-400 text-sm font-medium">Completed</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        {analytics.completed}
                                        <span className="text-lg text-gray-400 ml-2">({completedRate}%)</span>
                                    </p>
                                </div>
                            </div>

                        </div>


                        {/* Chart */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                                    <TrendingUp className="text-blue-500" size={24} />
                                    Appointments per Doctor
                                </h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart
                                        data={analytics.doctorStats.filter((doc) =>
                                            selectedDoctor === "all" ? true : doc.doctor === selectedDoctor
                                        )}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                    >
                                        <XAxis
                                            dataKey="doctor"
                                            stroke="#9ca3af"
                                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis
                                            stroke="#9ca3af"
                                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                                            domain={[0, "auto"]}
                                            allowDecimals={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />
                                        <Bar dataKey="appointments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="cancellations" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                ) : null}
            </main>
        </div>
    );
}