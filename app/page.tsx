import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";

export default function Home() {
  return (
    <main className="min-h-screen flex-1 p-8">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="AI Daily Brief">
          <p className="text-gray-400">
            Your personalized daily briefing will appear here.
          </p>
        </DashboardCard>

        <DashboardCard title="Today's Schedule">
          <p className="text-gray-400">
            Calendar events will appear here.
          </p>
        </DashboardCard>
      </div>
    </main>
  );
}