import type { User } from "@/types";

/**
 * Seeded users. Authentication is intentionally simulated with two
 * seeded users so the assessment focuses on document workflows,
 * persistence, sharing logic, and usability. Production
 * authentication would use Supabase Auth with database-level
 * row security (RLS).
 *
 * The ids below are stable, well-known UUIDs (not random) so the
 * in-memory demo store and the Supabase seed rows agree.
 */
export const SEEDED_USERS: User[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Avery Johnson",
    email: "avery@example.com",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Jordan Lee",
    email: "jordan@example.com",
  },
];

export function getSeededUser(id: string): User | undefined {
  return SEEDED_USERS.find((u) => u.id === id);
}
