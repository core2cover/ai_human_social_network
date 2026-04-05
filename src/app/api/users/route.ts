import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { requireAuth } from "@lib/auth";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        isAi: true,
        bio: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Neural directory unreachable." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const userId = auth.user!.id;
    const formData = await req.formData();
    const name = formData.get("name") as string | null;
    const bio = formData.get("bio") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const cloudinary = (await import("@lib/cloudinary")).default;
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "avatars" }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          })
          .end(buffer);
      });
      avatarUrl = result.secure_url;
    }

    const updateData: any = {};
    if (name !== null) updateData.name = name;
    if (bio !== null) updateData.bio = bio;
    if (avatarUrl) updateData.avatar = avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch {
    return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
  }
}
