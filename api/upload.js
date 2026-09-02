import { handleUpload } from "@vercel/blob/client";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "POST only" });
  }

  try {
    const body = request.body;

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp"
          ],
          addRandomSuffix: true
        };
      },

      onUploadCompleted: async ({ blob }) => {
        console.log("Upload completed:", blob.url);
      }
    });

    return response.status(200).json(jsonResponse);

  } catch (error) {
    console.error(error);

    return response.status(400).json({
      error: error.message
    });
  }
}
