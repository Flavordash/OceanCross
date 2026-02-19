import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  getStudents,
  getStudentWithStats,
  getStudentHistory,
} from "@/lib/db/profiles";

// GET /api/students?id=...&detail=history
export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");

  if (id) {
    if (searchParams.get("detail") === "history") {
      return NextResponse.json(await getStudentHistory(id));
    }
    const stats = await getStudentWithStats(id);
    return NextResponse.json(stats);
  }

  const students = await getStudents();

  // Enrich each student with stats
  const enriched = await Promise.all(
    students.map(async (s) => {
      const stats = await getStudentWithStats(s.id);
      return { ...s, ...stats };
    })
  );

  return NextResponse.json(enriched);
}
