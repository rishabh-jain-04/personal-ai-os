"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function SignInButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-300">
          {session.user?.email}
        </p>

        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
    >
      Sign in with Google
    </button>
  );
}