import { User } from "@prisma/client";

/** Strip passwordHash before sending user data to the client. */
export function safeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}
