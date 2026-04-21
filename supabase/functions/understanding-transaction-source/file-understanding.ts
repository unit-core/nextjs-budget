import { GoogleGenAI } from "npm:@google/genai";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { buildResponseSchema, type Category } from "./response-schema.ts";
import { buildSystemInstructions } from "./system-instructions.ts";

const GEMINI_MODEL = "gemini-3.1-pro-preview";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface TextSource {
  text: string;
}

interface FileSource {
  id: string;
  name: string;
  mimeType: string;
  bucket_id: string;
}

export interface UnderstandingError {
  code: string;
  message: string;
}

export interface UnderstandingData {
  name: string;
  executed_at: string;
  transaction_type: string;
  items: {
    name: string;
    currency_code: string;
    amount: number;
    transaction_item_category_id: string;
  }[];
}

export type UnderstandingResult =
  | { data: UnderstandingData; error: null }
  | { data: null; error: UnderstandingError };

function createSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function downloadInvoiceSource(source: FileSource) {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .storage
    .from("transactions")
    .download(source.name);

  if (error) throw error;
  return data;
}

function parseGeminiResponse(raw: string): UnderstandingResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { data: null, error: { code: "PARSE_ERROR", message: "Gemini returned non-JSON response" } };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { data: null, error: { code: "PARSE_ERROR", message: "Gemini response is not an object" } };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.error !== null && typeof obj.error === "object") {
    const err = obj.error as Record<string, unknown>;
    return {
      data: null,
      error: {
        code: typeof err.code === "string" ? err.code : "UNKNOWN_ERROR",
        message: typeof err.message === "string" ? err.message : "Unknown error from model",
      },
    };
  }

  if (obj.data !== null && typeof obj.data === "object") {
    return { data: obj.data as UnderstandingData, error: null };
  }

  return { data: null, error: { code: "PARSE_ERROR", message: "Gemini response has neither data nor error" } };
}

export async function understandText(source: TextSource, categories: Category[]): Promise<UnderstandingResult> {
  try {
    const contents = [
      { text: buildSystemInstructions(categories) },
      { text: source.text }
    ];

    const config = {
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(categories),
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: config
    });

    return parseGeminiResponse(response.text ?? "");
  } catch (e) {
    return {
      data: null,
      error: {
        code: "AI_ERROR",
        message: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }
}

const SUPPORTED_INLINE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]

const TEXT_MIME_TYPES = [
  "text/plain",
  "text/csv",
]

export async function understandFile(source: FileSource, categories: Category[]): Promise<UnderstandingResult> {
  try {
    const fileData = await downloadInvoiceSource(source);
    const mimeType = source.mimeType.toLowerCase();

    if (TEXT_MIME_TYPES.includes(mimeType)) {
      const text = await fileData.text();
      return understandText({ text }, categories);
    }

    if (!SUPPORTED_INLINE_MIME_TYPES.includes(mimeType)) {
      return {
        data: null,
        error: {
          code: "UNSUPPORTED_DOCUMENT",
          message: `Unsupported mime type: ${source.mimeType}`,
        },
      };
    }

    const base64 = Buffer
      .from(await fileData.arrayBuffer())
      .toString("base64");

    const contents = [
      { text: buildSystemInstructions(categories) },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64
        }
      }
    ];
    const config = {
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(categories),
    };
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: contents,
      config: config
    });

    return parseGeminiResponse(response.text ?? "");
  } catch (e) {
    return {
      data: null,
      error: {
        code: "AI_ERROR",
        message: e instanceof Error ? e.message : "Unknown error",
      },
    };
  }
}
