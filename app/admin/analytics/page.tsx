"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getDoctors } from "@/lib/actions/doctor.actions";
import { TrendingUp, Users, Calendar, XCircle, BarChart3, Filter } from "lucide-react";

interface DoctorAnalytics {
    doctor: string;
    appointments: number;
    cancellations: number;
}

interface AdminAnalytics {
    totalAppointments: number;
    totalCancellations: number;
    doctorStats: DoctorAnalytics[];
}

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch doctors
    useEffect(() => {
        const fetchDoctors = async () => {
            const doctorList = await getDoctors();
            setDoctors(doctorList);
        };
        fetchDoctors();
    }, []);

    // Fetch analytics
    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const params =
                    selectedDoctor !== "all" ? `?doctor=${encodeURIComponent(selectedDoctor)}` : "";
                const res = await fetch(`/api/analytics${params}`);
                const data = await res.json();
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, [selectedDoctor]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-2">{payload[0].payload.doctor}</p>
                    <div className="space-y-1">
                        <p className="text-blue-400 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Appointments: {payload[0].value}
                        </p>
                        <p className="text-red-400 text-sm flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                            Cancellations: {payload[1].value}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading || !analytics) {
        return (
            <div className="max-w-7xl mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen text-white p-4 md:p-8">
                <AdminHeader />
                <main className="space-y-8 mt-8">
                    {/* Title Skeleton */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl" />
                        <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 animate-pulse">
                            <div className="h-10 bg-gray-700 rounded-lg w-1/3"></div>
                        </div>
                    </div>

                    {/* Summary Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="relative group animate-pulse"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                                    <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                                    <div className="h-10 bg-gray-700 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filter Skeleton */}
                    <div className="relative animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                            <div className="h-10 bg-gray-700 rounded w-1/3"></div>
                        </div>
                    </div>

                    {/* Chart Skeleton */}
                    <div className="relative animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                            <div className="h-80 bg-gray-700/50 rounded-lg w-full"></div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const cancellationRate = analytics.totalAppointments > 0 
        ? ((analytics.totalCancellations / analytics.totalAppointments) * 100).toFixed(1)
        : "0";

    return (
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 min-h-screen text-white p-4 md:p-8">
            <AdminHeader />

            <main className="space-y-8 mt-8">
                {/* Header */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl" />
                    <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-600/30">
                                <BarChart3 className="text-blue-500" size={32} />
                            </div>
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-bold text-white">Analytics Dashboard</h2>
                                <p className="text-gray-400 mt-1 text-sm sm:text-base">
                                    Monitor performance and insights
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Doctors Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 hover:border-blue-600/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-600/30">
                                    <Users className="text-blue-500" size={24} />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-blue-600/20 border border-blue-600/30">
                                    <TrendingUp size={16} className="text-blue-500" />
                                </div>
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Doctors</h3>
                            <p className="text-4xl font-bold text-white">{doctors.length}</p>
                        </div>
                    </div>

                    {/* Appointments Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-green-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 hover:border-green-600/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-green-600/20 border border-green-600/30">
                                    <Calendar className="text-green-500" size={24} />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-green-600/20 border border-green-600/30 text-green-400 text-xs font-semibold">
                                    Active
                                </div>
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Appointments</h3>
                            <p className="text-4xl font-bold text-white">{analytics.totalAppointments}</p>
                        </div>
                    </div>

                    {/* Cancellations Card */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-red-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 hover:border-red-600/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-red-600/20 border border-red-600/30">
                                    <XCircle className="text-red-500" size={24} />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-semibold">
                                    {cancellationRate}%
                                </div>
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-2">Cancellations</h3>
                            <p className="text-4xl font-bold text-white">{analytics.totalCancellations}</p>
                        </div>
                    </div>
                </div>

                {/* Doctor Filter */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-2xl blur-xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-600/20 border border-purple-600/30">
                                    <Filter className="text-purple-500" size={20} />
                                </div>
                                <label htmlFor="doctorFilter" className="text-gray-300 font-semibold">
                                    Filter by Doctor:
                                </label>
                            </div>
                            <select
                                id="doctorFilter"
                                className="flex-1 sm:flex-none sm:min-w-[250px] bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer hover:bg-gray-750"
                                value={selectedDoctor}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    setSelectedDoctor(e.target.value)
                                }
                            >
                                <option value="all">All Doctors</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor.$id} value={doctor.name}>
                                        {doctor.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
                    <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-600/30">
                                <BarChart3 className="text-blue-500" size={20} />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-semibold text-white">
                                Appointments per Doctor
                            </h3>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-800/50">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-500"></div>
                                <span className="text-sm text-gray-400">Appointments</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-red-500"></div>
                                <span className="text-sm text-gray-400">Cancellations</span>
                            </div>
                        </div>

                        {/* Chart Container */}
                        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={analytics.doctorStats.filter((doc) =>
                                        selectedDoctor === "all"
                                            ? doctors.some((d) => d.name === doc.doctor)
                                            : doc.doctor === selectedDoctor
                                    )}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                >
                                    <XAxis 
                                        dataKey="doctor" 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        domain={[0, "auto"]}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                                    <Bar dataKey="appointments" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="cancellations" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}