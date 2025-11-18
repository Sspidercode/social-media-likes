"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getLikeStateService,
  toggleLikeService,
} from "@/services/like.service";

interface IPostCard {
  post: {
    id: string;
    title: string;
    author: string;
    description: string;
  };
}

export const PostCard = ({ post }: IPostCard) => {
  const router = useRouter();
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liked, setLiked] = useState<boolean>(false);
  const [isLiking, setIsLiking] = useState<boolean>(false);

  // Initial fetch + 2s polling for "real-time" updates
  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const fetchLikeState = async () => {
      try {
        const res = await getLikeStateService(post.id);
        if (!res.success || !res.data) return;
        setLikeCount(res.data.likesCount ?? 0);
        setLiked(Boolean(res.data.liked));
      } catch {
        // ignore
      }
    };

    const startPolling = () => {
      if (pollingInterval) return;
      pollingInterval = setInterval(fetchLikeState, 2000);
    };

    fetchLikeState();
    startPolling();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [post.id]);

  const handleLikeToggle = async () => {
    if (isLiking) return;

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;

    setIsLiking(true);
    setLiked(nextLiked);
    setLikeCount((prev: number) =>
      Math.max(0, prev + (nextLiked ? 1 : -1))
    );

    try {
      const res = await toggleLikeService(post.id);

      if (!res.success && res.status === 401) {
        // Revert optimistic update
        setLiked(previousLiked);
        setLikeCount(previousCount);
        toast.error("Login to like this post.");
        router.push("/login");
        return;
      }

      if (!res.success || !res.data) {
        // Revert optimistic update on failure
        setLiked(previousLiked);
        setLikeCount(previousCount);
        toast.error(res.message || "Failed to update like. Please try again.");
        return;
      }

      setLiked(Boolean(res.data.liked));
      setLikeCount(res.data.likesCount ?? previousCount);
    } catch {
      // Revert optimistic update on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error("Failed to update like. Please try again.");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-4">
        <CardTitle className="text-base">{post.title}</CardTitle>
        <CardDescription>by @{post.author}</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <p className="text-base text-muted-foreground">{post.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          {likeCount} likes • 0 comments • 0 bookmarks
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={cn(
              "px-3 py-1 text-sm rounded-md border flex items-center gap-2 transition-colors",
              liked
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-background text-foreground"
            )}
          >
            <Heart
              className={cn(
                "w-4 h-4",
                liked ? "fill-current text-red-500" : "text-muted-foreground"
              )}
            />
            <span>Like</span>
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 text-xs">
              {likeCount}
            </span>
          </button>
          <button className="px-3 py-1 text-sm rounded-md border">
            Comment
          </button>
          <button className="px-3 py-1 text-sm rounded-md border">
            Bookmark
          </button>
        </div>
      </CardFooter>
    </Card>
  );
};


