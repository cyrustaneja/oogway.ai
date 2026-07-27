export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth-token";
import { bulkSoftDelete } from "@/lib/db/soft-delete";

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

    const result = await bulkSoftDelete(modelName, ids);
    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    console.error("[POST /api/trash/bulk-delete] Error:", err);
    return NextResponse.json({ error: err.message || "Bulk deletion failed." }, { status: 500 });
  }
}
