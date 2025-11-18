import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const requestSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6),
  fullName: z.string().min(3).max(100),
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
    console.log("Register endpoint called", req);
    
    const payload = await req.json();
    const { fullName, username, password } = requestSchema.parse(payload);

    const db = await getDb();

    const existing = await db.collection("users").findOne({ username });
    if (existing) {
      return NextResponse.json({ message: "Username already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date();
    const insertResult = await db.collection("users").insertOne({
      username,
      password: passwordHash,
      fullName,
      createdAt: now,
      updatedAt: now,
    });

    const userId = String(insertResult.insertedId);

    const token = jwt.sign(
      { sub: userId, username },
      getJwtSecret(),
      { expiresIn: "1h" }
    );

    const res = NextResponse.json({ token, user: { _id: userId, username, fullName } }, { status: 201 });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set("social_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });
    return res;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


