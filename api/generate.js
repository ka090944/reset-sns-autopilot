export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        input: `
あなたはパーソナルジム「RESET」のSNSマーケティング担当です。

Instagram投稿用の文章を1つ作成してください。

【RESETのコンセプト】
・90日卒業型パーソナルジム
・「教えられる」から「自立する」へ
・トレーニングだけでなく食事・生活習慣もサポート
・最終的には自分で身体を管理できる状態を目指す
・初心者にも分かりやすく伝える
・札幌で実施

【投稿の目的】
・新規顧客の獲得
・プロフィール閲覧
・フォロー
・保存
・DM、体験相談につなげる
・RESETの考え方や他ジムとの違いを伝える

【文章の条件】
・Instagramで読みやすい文章
・堅すぎない
・過度な煽り表現は使わない
・適度に絵文字を使用
・最後に自然なCTAを入れる
・適切なハッシュタグを付ける
・毎回同じ内容にならないようテーマを変える

投稿本文だけを出力してください。
        `,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: data,
      });
    }

    const caption = data.output
      ?.flatMap((item) => item.content || [])
      ?.find((item) => item.type === "output_text")
      ?.text;

    if (!caption) {
      return res.status(500).json({
        error: "Caption generation failed",
        data,
      });
    }

    return res.status(200).json({
      success: true,
      caption,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
