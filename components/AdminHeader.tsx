"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const NavLinks = () => (
    <>
      <Link href="/admin" onClick={() => setIsOpen(false)} className="text-16-semibold text-white">
        Dashboard 
      </Link>
      <Link href="/admin/doctors" onClick={() => setIsOpen(false)} className="text-16-semibold text-white">
        Doctors                                                                                                  
      </Link>
      <Link href="/admin/analytics" onClick={() => setIsOpen(false)} className="text-16-semibold text-white">
        Analytics
      </Link>
      <button
        title="Logout"
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-400 hover:text-red-500 transition"
      >
        <LogOut size={18}/> Logout
      </button>
    </>
  );

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-black shadow-md sticky top-0 z-50">
      {/* Logo */}
      <Link href="/admin" className="cursor-pointer">
        <Image
          src="/assets/icons/logo-full.svg"
          height={32}
          width={162}
          alt="logo"
          className="h-8 w-fit"
        />
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        <NavLinks />
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded hover:bg-gray-800 text-white"
      >
        {isOpen ? <X size={20}/> : <Menu size={20}/>}
      </button>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="absolute top-14 right-4 bg-black shadow-lg rounded-md p-4 flex flex-col gap-3 w-48 md:hidden">
          <NavLinks />
        </div>
      )}
    </header>
  );
}
