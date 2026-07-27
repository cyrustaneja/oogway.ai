export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { softDelete } from "@/lib/db/soft-delete";

export async function POST(req: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (token as any).role;
  if (role !== "ADMIN" && role !== "TEAM") {
    return NextResponse.json({ error: "Forbidden: Only Admins and Team members can delete items." }, { status: 403 });
  }

  try {
    const { type, ids } = await req.json();
    if (!type || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "type and a non-empty ids array are required." }, { status: 400 });
    }

    let modelName = "";
    if (type === "session" || type === "analysisSession") modelName = "analysisSession";
    else if (type === "batch") modelName = "batch";
    else if (type === "expert" || type === "user") modelName = "expert";
    else if (type === "course") modelName = "course";
    else return NextResponse.json({ error: `Invalid type: ${type}` }, { status: 400 });

    let deletedCount = 0;
    for (const id of ids) {
      try {
        await softDelete(modelName, id);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to soft delete ${modelName} ${id}:`, err);
      }
    }

    return NextResponse.json({ success: true, count: deletedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Bulk deletion failed." }, { status: 500 });
  }
}
