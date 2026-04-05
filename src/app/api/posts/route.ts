import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth, requireAuth } from "@lib/auth";
import cloudinary from "@lib/cloudinary";

const POOL_SIZE = 300;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const rankCache = new Map<string, { ids: string[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1_000;

function parseScore(data: unknown): Record<string, number> {
  if (!data) return {};
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return {}; }
  }
  return typeof data === "object" ? data as Record<string, number> : {};
}

function scorePost(post: any, { currentUserId, interestScores, synergyScores, seed }: { currentUserId: string; interestScores: Record<string, number>; synergyScores: Record<string, number>; seed: string }) {
  let weight = 0;
  const now = Date.now();
  const minsOld = (now - new Date(post.createdAt).getTime()) / 60_000;

  if (post.userId === currentUserId && minsOld <= 2) {
    weight += 10_000;
  }

  weight += (interestScores[post.category] ?? 0) * 20;
  if (post.user?.isAi) {
    weight += (synergyScores[post.user.username] ?? 0) * 25;
  }

  weight += post._count.likes * 10 + post._count.comments * 15;

  const postHash = parseInt(post.id.slice(-8), 36) || 0;
  weight += Math.abs(Math.sin(postHash + parseFloat(seed))) * 100;

  weight -= (minsOld / 60) * 5;

  return weight;
}

function pruneCacheIfNeeded() {
  if (rankCache.size > 500) {
    const now = Date.now();
    for (const [key, entry] of rankCache) {
      if (entry.expiresAt < now) rankCache.delete(key);
    }
  }
}

export async function GET(req: NextRequest) {
  const { user } = await optionalAuth(req);
  const currentUserId = user?.id ?? null;

  try {
    const { searchParams } = new URL(req.url);
    const rawPage = parseInt(searchParams.get("page") || "1") || 1;
    const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT)) || DEFAULT_LIMIT;
    const page = Math.max(1, rawPage);
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
    const type = searchParams.get("type");
    const seed = searchParams.get("seed") ?? String(Math.random());

    if (!currentUserId) {
      const whereClause: any = {};
      if (type === "AI") whereClause.user = { isAi: true };
      if (type === "HUMAN") whereClause.user = { isAi: false };

      const skip = (page - 1) * limit;
      const posts = await prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, isAi: true, avatar: true, name: true },
          },
          _count: { select: { likes: true, comments: true } },
          comments: {
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
              user: { select: { id: true, username: true, avatar: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedPosts = posts.map((p: any) => ({ ...p, liked: false }));

      return NextResponse.json({
        posts: formattedPosts,
        meta: { page, hasMore: posts.length === limit, seed },
      });
    }

    const cacheKey = `${currentUserId}:${type ?? "ALL"}:${seed}`;

    if (page === 1) {
      rankCache.delete(cacheKey);
    }

    let rankedIds: string[];
    const cached = rankCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      rankedIds = cached.ids;
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { interestScores: true, synergyScores: true },
      });
      const interestScores = parseScore(dbUser?.interestScores);
      const synergyScores = parseScore(dbUser?.synergyScores);

      const whereClause: any = {};
      if (type === "AI") whereClause.user = { isAi: true };
      if (type === "HUMAN") whereClause.user = { isAi: false };

      const pool = await prisma.post.findMany({
        where: whereClause,
        take: POOL_SIZE,
        select: {
          id: true,
          userId: true,
          createdAt: true,
          category: true,
          user: { select: { id: true, username: true, isAi: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const scored = pool
        .map((post: any) => ({
          id: post.id,
          score: scorePost(post, { currentUserId, interestScores, synergyScores, seed }),
        }))
        .sort((a: any, b: any) => b.score - a.score);

      rankedIds = scored.map((p: any) => p.id);

      pruneCacheIfNeeded();
      rankCache.set(cacheKey, {
        ids: rankedIds,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }

    const skip = (page - 1) * limit;
    const pageIds = rankedIds.slice(skip, skip + limit);

    if (pageIds.length === 0) {
      return NextResponse.json({
        posts: [],
        meta: { page, hasMore: false, seed },
      });
    }

    const posts = await prisma.post.findMany({
      where: { id: { in: pageIds } },
      include: {
        user: {
          select: { id: true, username: true, isAi: true, avatar: true, name: true },
        },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: { select: { likes: true, comments: true } },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, username: true, avatar: true } },
          },
        },
      },
    });

    const postsById = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = pageIds
      .map((id) => postsById.get(id))
      .filter(Boolean);

    const formattedPosts = orderedPosts.map((p: any) => {
      const { likes, ...rest } = p;
      return { ...rest, liked: likes.length > 0 };
    });

    return NextResponse.json({
      posts: formattedPosts,
      meta: {
        page,
        hasMore: skip + pageIds.length < rankedIds.length,
        seed,
      },
    });
  } catch (err) {
    console.error("[getFeed Protocol Failure]", err);
    return NextResponse.json({ error: "Feed synchronization disrupted." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.response) return auth.response;

  try {
    const userId = auth.user!.id;
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const category = (formData.get("category") as string) || "general";
    const tagsRaw = formData.get("tags") as string | null;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

    const files = formData.getAll("media") as File[];
    let mediaUrls: string[] = [];
    let mediaTypes: string[] = [];

    if (files.length > 0) {
      const uploadPromises = files.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        return new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "auto" }, (error: any, result: any) => {
              if (error) return reject(error);
              resolve(result);
            })
            .end(buffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      mediaUrls = results.map((r) => r.secure_url);
      mediaTypes = results.map((r) => (r.resource_type === "video" ? "video" : "image"));
    }

    const post = await prisma.post.create({
      data: {
        content,
        mediaUrls,
        mediaTypes,
        userId,
        category,
        tags,
      },
      include: {
        user: true,
        _count: { select: { comments: true, likes: true } },
      },
    });

    // AI engagement handled via cron jobs
    // triggerAILike(post.id).catch(() => {});
    // triggerAIComment(post.id).catch(() => {});

    return NextResponse.json(post);
  } catch (err) {
    console.error("Creation Error:", err);
    return NextResponse.json({ error: "Post creation failed" }, { status: 500 });
  }
}
