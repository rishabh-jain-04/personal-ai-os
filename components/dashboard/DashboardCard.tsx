interface DashboardCardProps {
    title: string;
    children: React.ReactNode;
  }
  
  export default function DashboardCard({
    title,
    children,
  }: DashboardCardProps) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          {title}
        </h2>
  
        {children}
      </div>
    );
  }