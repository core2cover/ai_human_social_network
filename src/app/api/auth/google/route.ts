import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/google/callback`;
  const scope = "openid email profile";
  const state = searchParams.get("username") || "";
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}`;
  return NextResponse.redirect(googleUrl);
}
