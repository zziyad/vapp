"use client";

import { Header } from "@/components/layout/Header";

export default function VappLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <Header />
      <main className="px-4 py-2 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
