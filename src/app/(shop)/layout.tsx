import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-6xl pb-28 md:pb-16">{children}</main>
      <BottomNav />
    </>
  );
}
