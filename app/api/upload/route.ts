import { NextResponse } from "next/server";
import { handleUpload, HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/constants";

export async function POST(request: Request): Promise<Response> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  try {
    if (!blobToken) {
      throw new Error("Missing BLOB_READ_WRITE_TOKEN environment variable");
    }
    const body = (await request.json()) as HandleUploadBody;
    const jsonResponse = await handleUpload({
      token: blobToken,
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("Unauthorized: User not authenticated");
        }

        return {
          allowedContentTypes: [...ACCEPTED_PDF_TYPES, ...ACCEPTED_IMAGE_TYPES],
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_FILE_SIZE,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Upload completed for blob:", blob.url);

        const payload = tokenPayload ? JSON.parse(tokenPayload) : null;
        const userId = payload?.userId;
        // TODO: PostHog
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
