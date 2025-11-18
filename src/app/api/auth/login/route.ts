import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const requestSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6),
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET env var");
  }
  return secret;
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { username, password } = requestSchema.parse(json);

    const db = await getDb();
    const user = await db.collection("users").findOne<{ _id: ObjectId; username: string; password: string; fullName?: string }>(
      { username }
    );

    if (!user || !user.password) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const secret = getJwtSecret();
    const token = jwt.sign(
      { sub: String(user._id), username },
      secret,
      { expiresIn: "1h" }
    );

    const res = NextResponse.json({ token, user: { _id: user._id, username: user.username, fullName: user.fullName } }, { status: 200 });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("social_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


