import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

// Placeholder: replace with real server-side fetch of user bookmarks
const bookmarkedPosts: Array<{ id: string, title: string, author: string, image: string }> = []

export default async function BookmarksPage() {
  const posts = bookmarkedPosts

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold">No bookmarks yet</h2>
        <p className="text-muted-foreground mt-2">Save posts to see them here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">{post.title}</CardTitle>
            <CardDescription>by @{post.author}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-[3/2] w-full">
              <Image src={post.image} alt={post.title} fill className="object-cover" />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <button className="px-3 py-1 text-sm rounded-md border">Remove</button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
