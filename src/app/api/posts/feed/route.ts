import { NextRequest, NextResponse } from "next/server";
import prisma from "@lib/prisma";
import { optionalAuth } from "@lib/auth";

const POOL_SIZE = 300;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CACHE_TTL_MS = 5 * 60 * 1_000;

const rankCache = new Map<string, { ids: string[]; expiresAt: number }>();

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
  if (post.userId === currentUserId && minsOld <= 2) weight += 10_000;
  weight += (interestScores[post.category] ?? 0) * 20;
  if (post.user?.isAi) weight += (synergyScores[post.user.username] ?? 0) * 25;
  weight += post._count.likes * 10 + post._count.comments * 15;
  const postHash = parseInt(post.id.slice(-8), 36) || 0;
  weight += Math.abs(Math.sin(postHash + parseFloat(seed))) * 100;
  weight -= (minsOld / 60) * 5;
  return weight;
}

export async function GET(req: NextRequest) {
  const { user } = optionalAuth(req);
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
          user: { select: { id: true, username: true, isAi: true, avatar: true, name: true } },
          _count: { select: { likes: true, comments: true } },
          comments: {
            take: 3, orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, username: true, avatar: true } } },
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
    if (page === 1) rankCache.delete(cacheKey);

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
          id: true, userId: true, createdAt: true, category: true,
          user: { select: { id: true, username: true, isAi: true } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const scored = pool.map((post: any) => ({
        id: post.id,
        score: scorePost(post, { currentUserId, interestScores, synergyScores, seed }),
      })).sort((a: any, b: any) => b.score - a.score);

      rankedIds = scored.map((p: any) => p.id);
      rankCache.set(cacheKey, { ids: rankedIds, expiresAt: Date.now() + CACHE_TTL_MS });
    }

    const skip = (page - 1) * limit;
    const pageIds = rankedIds.slice(skip, skip + limit);

    if (pageIds.length === 0) {
      return NextResponse.json({ posts: [], meta: { page, hasMore: false, seed } });
    }

    const posts = await prisma.post.findMany({
      where: { id: { in: pageIds } },
      include: {
        user: { select: { id: true, username: true, isAi: true, avatar: true, name: true } },
        likes: { where: { userId: currentUserId }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
        comments: {
          take: 3, orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, username: true, avatar: true } } },
        },
      },
    });

    const postsById = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = pageIds.map((id) => postsById.get(id)).filter(Boolean);
    const formattedPosts = orderedPosts.map((p: any) => {
      const { likes, ...rest } = p;
      return { ...rest, liked: likes.length > 0 };
    });

    return NextResponse.json({
      posts: formattedPosts,
      meta: { page, hasMore: skip + pageIds.length < rankedIds.length, seed },
    });
  } catch {
    return NextResponse.json({ error: "Feed synchronization disrupted." }, { status: 500 });
  }
}
