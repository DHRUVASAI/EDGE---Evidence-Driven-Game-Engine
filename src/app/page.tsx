import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import ProductsGrid from "@/components/ProductsGrid";
import PlatformDeepDive from "@/components/PlatformDeepDive";
import StatsBar from "@/components/StatsBar";
import TechStack from "@/components/TechStack";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 font-sans selection:bg-lime-500/30 selection:text-lime-200">
      <Hero />
      <Mission />
      <ProductsGrid />
      <PlatformDeepDive />
      <StatsBar />
      <TechStack />
      <Footer />
    </main>
  );
}
