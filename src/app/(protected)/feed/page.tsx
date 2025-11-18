import { samplePosts as posts } from "@/data/posts";
import { PostCard } from "@/components/post-card";

export default async function HomeFeedPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
