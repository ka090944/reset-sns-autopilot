export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const { put } = await import("@vercel/blob");

    const contentType =
      req.headers["content-type"] || "image/jpeg";

    const originalName =
      req.headers["x-file-name"] || "instagram-image.jpg";

    const safeName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    const pathname =
      `instagram/${Date.now()}-${safeName}`;

    const blob = await put(
      pathname,
      req,
      {
        access: "public",
        contentType,
        addRandomSuffix: true
      }
    );

    return res.status(200).json({
      success: true,
      url: blob.url
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
