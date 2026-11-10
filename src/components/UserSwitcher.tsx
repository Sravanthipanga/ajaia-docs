"use client";

import { useState } from "react";
import { SEEDED_USERS } from "@/lib/seed";
import type { User } from "@/types";

export const CURRENT_USER_KEY = "ajaia-docs-user";

export function useCurrentUser(): [User, (user: User) => void] {
  // Lazy initializer reads the stored user once; no effect needed.
  const [user, setUser] = useState<User>(() => {
    if (typeof window === "undefined") return SEEDED_USERS[0];
    try {
      const stored = window.localStorage.getItem(CURRENT_USER_KEY);
      return SEEDED_USERS.find((u) => u.id === stored) ?? SEEDED_USERS[0];
    } catch {
      return SEEDED_USERS[0];
    }
  });
  const switchUser = (next: User) => {
    setUser(next);
    try {
      window.localStorage.setItem(CURRENT_USER_KEY, next.id);
    } catch {
      // Ignore storage errors; the selection still applies for this session.
    }
  };
  return [user, switchUser];
}

export default function UserSwitcher({
  currentUser,
  onSwitch,
}: {
  currentUser: User;
  onSwitch: (user: User) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Current user:
      <select
        aria-label="Current user"
        value={currentUser.id}
        onChange={(e) => {
          const next = SEEDED_USERS.find((u) => u.id === e.target.value);
          if (next) onSwitch(next);
        }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
      >
        {SEEDED_USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
