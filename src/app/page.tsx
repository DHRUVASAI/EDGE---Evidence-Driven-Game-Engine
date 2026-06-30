"use client";

import useSWR from "swr";
import IntroSplash from "@/components/IntroSplash";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TrendCharts from "@/components/dashboard/TrendCharts";
import ICCRankings from "@/components/dashboard/ICCRankings";
import IPLConsole from "@/components/dashboard/IPLConsole";
import QuickActions from "@/components/dashboard/QuickActions";
import Footer from "@/components/Footer";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LoadingSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-zinc-900 rounded w-20" />
          <div className="h-8 bg-zinc-900 rounded w-72 md:w-96" />
        </div>
        <div className="h-10 bg-zinc-900 rounded w-40" />
      </div>
      
      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-zinc-900 rounded-xl border border-zinc-800/40" />
        <div className="h-32 bg-zinc-900 rounded-xl border border-zinc-800/40" />
        <div className="h-32 bg-zinc-900 rounded-xl border border-zinc-800/40" />
      </div>
      
      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[360px] bg-zinc-900 rounded-xl border border-zinc-800/40" />
        <div className="h-[360px] bg-zinc-900 rounded-xl border border-zinc-800/40" />
      </div>

      {/* ICC Rankings Skeleton */}
      <div className="h-[320px] bg-zinc-900 rounded-xl border border-zinc-800/40" />

      {/* IPL Console Skeleton */}
      <div className="h-[320px] bg-zinc-900 rounded-xl border border-zinc-800/40" />
    </div>
  );
}

export default function Home() {
  const { data, error, isLoading } = useSWR("/api/dashboard/summary", fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0f] font-sans selection:bg-lime-500/30 selection:text-lime-200">
      {/* Splash intro played overlay */}
      <IntroSplash />

      {/* Dashboard container */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-12 relative z-10">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center">
            <div className="text-red-500 text-lg font-bold">Failed to load system dashboard</div>
            <p className="text-sm text-zinc-500 mt-2">Please check your database connectivity and refresh.</p>
          </div>
        ) : (
          <>
            <DashboardHeader
              totalDeliveries={data.counts.totalDeliveries}
              totalPlayers={data.counts.totalPlayers}
              matchesPerFormat={data.counts.matchesPerFormat}
            />
            <TrendCharts
              seasonTrends={data.seasonTrends}
              topVenues={data.topVenues}
            />
            <ICCRankings />
            <IPLConsole
              orangeCap={data.iplSummary.orangeCap}
              purpleCap={data.iplSummary.purpleCap}
              mostSixesIPL={data.highlights.mostSixesIPL}
            />
            <QuickActions />
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
