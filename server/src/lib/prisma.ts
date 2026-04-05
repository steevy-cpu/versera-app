import { PrismaClient } from "@prisma/client";

// Single shared PrismaClient instance for the process lifetime
const prisma = new PrismaClient();

export default prisma;
