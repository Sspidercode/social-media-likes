import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import jwt from "jsonwebtoken";
import { z } from "zod";

export const runtime = "nodejs";

const likeBodySchema = z.object({
  postId: z.string().min(1),
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET env var");
  }
  return secret;
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("social_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

async function getLikeState(postId: string, userId: string | null) {
  const db = await getDb();
  const likesCollection = db.collection("likes");

  const [likesCount, userLike] = await Promise.all([
    likesCollection.countDocuments({ postId }),
    userId ? likesCollection.findOne({ postId, userId }) : Promise.resolve(null),
  ]);

  return {
    likesCount,
    liked: Boolean(userLike),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const stream = searchParams.get("stream");

  if (!postId) {
    return NextResponse.json({ message: "postId is required" }, { status: 400 });
  }

  // SSE stream for real-time like count updates
  if (stream === "1") {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let cancelled = false;

        const sendCurrent = async () => {
          if (cancelled) return;
          const { likesCount } = await getLikeState(postId, null);
          const payload = JSON.stringify({ postId, likesCount });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        };

        await sendCurrent();
        const interval = setInterval(sendCurrent, 2000);

        const close = () => {
          if (cancelled) return;
          cancelled = true;
          clearInterval(interval);
          controller.close();
        };

        // Best-effort cleanup when the client disconnects (ignored if not supported)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maybeSignal: any = (request as any).signal;
        if (maybeSignal && typeof maybeSignal.addEventListener === "function") {
          maybeSignal.addEventListener("abort", close);
        }
      },
      cancel() {
        // Nothing special here; interval is cleared in start via abort signal
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const userId = getUserIdFromRequest(request);

  try {
    const state = await getLikeState(postId, userId);
    return NextResponse.json(state, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to fetch likes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  console.log("userId", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { postId } = likeBodySchema.parse(json);

    const db = await getDb();
    const likesCollection = db.collection("likes");

    const existing = await likesCollection.findOne({ postId, userId });

    let liked: boolean;
    if (existing) {
      await likesCollection.deleteOne({ _id: existing._id });
      liked = false;
    } else {
      await likesCollection.insertOne({
        postId,
        userId,
        createdAt: new Date(),
      });
      liked = true;
    }

    const likesCount = await likesCollection.countDocuments({ postId });

    return NextResponse.json(
      {
        liked,
        likesCount,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update like" }, { status: 500 });
  }
}


