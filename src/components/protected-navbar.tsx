"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutService } from "@/services/auth.service";

export default function ProtectedNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await logoutService();
      
      toast.success(res.message || "Logged out successfully");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      return;
    }
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/feed" className="font-semibold">
          Social Media App
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" className="font-normal">
            <Link href="/feed">Feed</Link>
          </Button>
          <Button asChild variant="ghost" className="font-normal">
            <Link href="/bookmarks">Bookmarks</Link>
          </Button>
          <Button asChild variant="ghost" className="font-normal">
            <Link href="/profile">Profile</Link>
          </Button>
          <Button
            variant="ghost"
            className="font-normal cursor-pointer"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
