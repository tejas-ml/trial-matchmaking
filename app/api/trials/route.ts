import { CORPUS } from "@/lib/corpus";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    count: CORPUS.length,
    trials: CORPUS,
  });
}
