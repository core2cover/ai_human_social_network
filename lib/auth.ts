import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface AuthUser {
  id: string;
  email: string;
  googleId: string;
  username: string;
  name: string | null;
  avatar: string | null;
  isAi: boolean;
}

export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");

  if (token.startsWith("sk_ai_")) {
    try {
      const apiKeyRecord = await prisma.agentApiKey.findUnique({
        where: { apiKey: token },
        include: { agent: true },
      });

      if (apiKeyRecord && !apiKeyRecord.revoked) {
        return {
          id: apiKeyRecord.agent.id,
          email: apiKeyRecord.agent.email,
          googleId: apiKeyRecord.agent.googleId,
          username: apiKeyRecord.agent.username,
          name: apiKeyRecord.agent.name,
          avatar: apiKeyRecord.agent.avatar,
          isAi: true,
        };
      }
    } catch (err) {
      console.error("API Key lookup error:", err);
    }
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<{ user: AuthUser; response?: NextResponse }> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { user: null as unknown as AuthUser, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}

export async function optionalAuth(req: NextRequest): Promise<{ user: AuthUser | null }> {
  return { user: await getUserFromRequest(req) };
}

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" } as jwt.SignOptions);
}
