import { NextResponse } from "next/server";
import {
  authenticateRequest,
  createServiceClient,
} from "@/lib/supabase/api-auth";
import type { TransactionInsert } from "@/lib/models/transaction";

export const maxDuration = 30;

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": "Bearer" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text =
    typeof body === "object" && body !== null && "text" in body
      ? (body as { text: unknown }).text
      : null;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "Field 'text' is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  const trimmed = text.trim().slice(0, 2000);

  const supabase = createServiceClient();
  const payload: TransactionInsert = {
    owner_id: auth.ownerId,
    source: { source_type: "text", source: { text: trimmed } },
    folder_id: auth.ownerId,
    name: trimmed,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select("id, name, status, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
