"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/table/DataTable";
import { Appointment, Doctor } from "@/types/appwrite.types";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { columns } from "@/components/table/columns";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";

const AdminPage = () => {
  const router = useRouter();
  const [appointmentsData, setAppointmentsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false); 

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await getRecentAppointmentList();
        setAppointmentsData(data || null);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await getRecentAppointmentList();
      setAppointmentsData(data || null);
    } catch (error) {
      console.error("Failed to refresh appointments:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-medium text-gray-700 animate-pulse">
          Loading appointments...
        </p>
      </div>
    );
  }

  if (!appointmentsData) {
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load appointments. Please try again later.
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      {/* Header */}
      <header className="admin-header flex items-center gap-6">
        <Link href="/" className="cursor-pointer">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/admin" className="text-16-semibold">
            Dashboard
          </Link>
          <Link href="/admin/doctors" className="text-16-semibold">
            Doctors
          </Link>
          <button
            title="Logout !"
            onClick={handleLogout}
            className="text-white px-2 py-1 rounded-lg transition"
          >
            <LogOut />
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="admin-main">
        {/* Welcome Section */}
        <section className="w-full space-y-4">
          <h1 className="header">Welcome Admin! 👋</h1>
          <p className="text-dark-700">
            Start the day with managing new appointments
          </p>
        </section>

        {/* Stats Section */}
        <section className="admin-stat flex flex-wrap gap-4">
          <StatCard
            type="appointments"
            count={appointmentsData.scheduledCount || 0}
            label="Scheduled appointments"
            icon="/assets/icons/appointments.svg"
          />
          <StatCard
            type="pending"
            count={appointmentsData.pendingCount || 0}
            label="Pending appointments"
            icon="/assets/icons/pending.svg"
          />
          <StatCard
            type="cancelled"
            count={appointmentsData.cancelledCount || 0}
            label="Cancelled appointments"
            icon="/assets/icons/cancelled.svg"
          />
          <StatCard
            type="completed"
            count={appointmentsData.completedCount || 0}
            label="Completed appointments"
            icon="/assets/icons/completed.svg"
          />
        </section>

        {/* DataTable with skeleton loader */}
        {refreshing ? (
          <div className="w-full border border-gray-200 rounded-md overflow-hidden animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-12 border-b border-gray-200 bg-gray-100 last:border-b-0"
              ></div>
            ))}
          </div>
        ) : (
          <DataTable<Appointment & { doctor: Doctor }, unknown>
            columns={columns}
            data={appointmentsData.documents}
          />
        )}
      </main>

      {/* Refresh Button bottom-left */}
      <div className="flex bottom-3 left-6 pb-7">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin" : ""}
          />{" "}
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
