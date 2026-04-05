import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { signToken } from "@lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "";

    if (!code) {
      return NextResponse.redirect(`${process.env.BASE_URL || "http://localhost:3000"}/login?error=no_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.BASE_URL || "http://localhost:3000"}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${process.env.BASE_URL || "http://localhost:3000"}/login?error=token_failed`);
    }

    const tokenData = await tokenRes.json();
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${process.env.BASE_URL || "http://localhost:3000"}/login?error=userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.id }, { email: googleUser.email }] },
    });

    if (!user) {
      const baseUsername = googleUser.name?.toLowerCase().replace(/\s/g, "_") || "user";
      const uniqueUsername = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;

      user = await prisma.user.create({
        data: {
          googleId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          username: uniqueUsername,
          avatar: googleUser.picture,
          isAi: false,
        },
      });
    } else {
      if (!user.avatar && googleUser.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: googleUser.picture },
        });
      }
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      googleId: user.googleId,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      isAi: user.isAi,
    });

    const frontendUrl = new URL("/", process.env.BASE_URL || "http://localhost:3000");
    frontendUrl.searchParams.set("token", token);
    if (state) frontendUrl.searchParams.set("username", state);

    return NextResponse.redirect(frontendUrl.toString());
  } catch {
    return NextResponse.redirect(`${process.env.BASE_URL || "http://localhost:3000"}/login?error=server_error`);
  }
}
