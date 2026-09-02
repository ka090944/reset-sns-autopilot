const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramUserId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !instagramUserId) {
    return res.status(500).json({
      error: "Instagram environment variables are missing",
    });
  }

  const { imageUrl, caption } = req.body || {};

  if (!imageUrl) {
    return res.status(400).json({
      error: "imageUrl is required",
    });
  }

  try {
    // 1. 投稿コンテナを作成
    const createParams = new URLSearchParams({
      image_url: imageUrl,
      caption: caption || "",
      access_token: accessToken,
    });

    const createResponse = await fetch(
      `https://graph.instagram.com/v26.0/${instagramUserId}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: createParams,
      }
    );

    const createData = await createResponse.json();

    if (!createResponse.ok || !createData.id) {
      return res.status(400).json({
        step: "create_container",
        error: createData,
      });
    }

    const containerId = createData.id;

    // 2. コンテナが公開可能になるまで待つ
    let statusData = null;

    for (let i = 0; i < 10; i++) {
      await sleep(3000);

      const statusResponse = await fetch(
        `https://graph.instagram.com/v26.0/${containerId}?fields=status_code,status&access_token=${encodeURIComponent(
          accessToken
        )}`
      );

      statusData = await statusResponse.json();

      if (!statusResponse.ok) {
        return res.status(400).json({
          step: "check_status",
          containerId,
          error: statusData,
        });
      }

      if (statusData.status_code === "FINISHED") {
        break;
      }

      if (
        statusData.status_code === "ERROR" ||
        statusData.status_code === "EXPIRED"
      ) {
        return res.status(400).json({
          step: "container_failed",
          containerId,
          status: statusData,
        });
      }
    }

    if (!statusData || statusData.status_code !== "FINISHED") {
      return res.status(400).json({
        step: "container_not_ready",
        containerId,
        status: statusData,
      });
    }

    // 3. 公開
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });

    const publishResponse = await fetch(
      `https://graph.instagram.com/v26.0/${instagramUserId}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: publishParams,
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || !publishData.id) {
      return res.status(400).json({
        step: "publish",
        containerId,
        error: publishData,
      });
    }

    return res.status(200).json({
      success: true,
      containerId,
      mediaId: publishData.id,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
