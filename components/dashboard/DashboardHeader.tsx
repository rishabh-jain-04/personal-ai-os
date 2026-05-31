import SignInButton from "./SignInButton";

export default function DashboardHeader() {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-white">
          Personal AI OS
        </h1>

        <p className="text-gray-400 mt-2">
          AI-powered daily planning and productivity dashboard
        </p>
      </div>

      <SignInButton />
    </div>
  );
}