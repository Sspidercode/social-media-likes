import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-4xl font-bold">
        Welcome to Social Media Application
      </h1>
      <div className="flex gap-2">
        <Button variant="default" className="cursor-pointer">
        <Link href="/login" className="text-lg">
          Login
        </Link>
        </Button>
        <Button variant="default" className="cursor-pointer">
          <Link href="/register" className="text-lg">
            Register
          </Link>
        </Button>
      </div>
    </div>
  );
}
