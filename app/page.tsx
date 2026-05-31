import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardCard from "@/components/dashboard/DashboardCard";
import CalendarEvents from "@/components/dashboard/CalendarEvents";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="AI Daily Brief">
          <p className="text-gray-400">
            Heavy rain expected after 6 PM. Leave by 8:10 AM to
            reach office on time.
          </p>
        </DashboardCard>

        <DashboardCard title="Today's Schedule">
          <CalendarEvents />
        </DashboardCard>

        <DashboardCard title="Priority Tasks">
          <ul className="space-y-2 text-gray-300">
            <li>• Finish consulting case practice</li>
            <li>• Reply to internship email</li>
            <li>• Prepare MBA documents</li>
          </ul>
        </DashboardCard>

        <DashboardCard title="Weather & Commute">
          <p className="text-gray-400">
            Rain probability: 80%
            <br />
            Estimated commute: 52 mins
          </p>
        </DashboardCard>

        <DashboardCard title="Important Emails">
          <ul className="space-y-2 text-gray-300">
            <li>Recruiter follow-up</li>
            <li>Project deadline reminder</li>
            <li>Meeting rescheduled</li>
          </ul>
        </DashboardCard>

        <DashboardCard title="Recommendations">
          <ul className="space-y-2 text-gray-300">
            <li>• Use 11 AM – 1 PM for deep work</li>
            <li>• Reschedule gym if rain worsens</li>
            <li>• Complete priority tasks before 5 PM</li>
          </ul>
        </DashboardCard>
      </div>
    </main>
  );
}