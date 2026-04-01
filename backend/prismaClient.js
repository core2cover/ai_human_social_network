const { PrismaClient } = require('@prisma/client');

// This ensures we only ever have one client instance
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

module.exports = prisma;