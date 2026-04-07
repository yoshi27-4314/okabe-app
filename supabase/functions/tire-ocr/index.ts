const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");

    const { image, mode } = await req.json();

    if (!image || !mode) {
      return new Response(
        JSON.stringify({ error: "image and mode are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const match = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: "Invalid image format. Expected base64 data URL." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    const mediaType = match[1];
    const base64Data = match[2];

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "plate_number") {
      systemPrompt = "あなたは車のナンバープレートを読み取るOCRアシスタントです。";
      userPrompt = `この画像は車のナンバープレートです。ナンバーを読み取ってください。

必ず以下のJSON形式のみで回答してください。他のテキストは含めないでください。
{
  "plate_number": "ナンバー全体（例: 岐阜 500 あ 1234）",
  "region": "地域名（例: 岐阜）",
  "class_number": "分類番号（例: 500）",
  "kana": "ひらがな（例: あ）",
  "serial": "一連番号（例: 1234）",
  "confidence": "読み取り確度 high/medium/low"
}

注意:
- 地域名・分類番号・ひらがな・一連番号をそれぞれ正確に分離してください
- plate_numberは全体をスペース区切りで結合してください
- 読み取れない部分は「?」にしてください`;

    } else if (mode === "tire_info") {
      systemPrompt = "あなたはタイヤの側面に刻印された情報を読み取るOCRアシスタントです。";
      userPrompt = `この画像はタイヤの側面です。タイヤの情報を読み取ってください。

必ず以下のJSON形式のみで回答してください。他のテキストは含めないでください。
{
  "manufacturer": "メーカー名（例: BRIDGESTONE, YOKOHAMA, DUNLOP, TOYO, MICHELIN等）",
  "pattern": "パターン名・商品名（例: ECOPIA EP150, iceGUARD 7等）",
  "size": "タイヤサイズ（例: 195/65R15）",
  "width": "タイヤ幅mm（例: 195）",
  "aspect": "偏平率（例: 65）",
  "diameter": "リム径インチ（例: 15）",
  "load_index": "ロードインデックスが読み取れれば（例: 91）",
  "speed_rating": "速度記号が読み取れれば（例: H）",
  "dot": "DOTコード（製造年週）が読み取れれば（例: 2024）",
  "confidence": "読み取り確度 high/medium/low"
}

注意:
- タイヤサイズは 幅/偏平率R直径 の形式です
- メーカー名は英語表記で読み取ってください
- 読み取れない項目はnullにしてください`;

    } else if (mode === "tread_depth") {
      systemPrompt = "あなたはタイヤの残溝深さを測定している画像を読み取るアシスタントです。";
      userPrompt = `この画像はタイヤの溝に定規またはデプスゲージを当てて残溝深さを測定しているものです。

必ず以下のJSON形式のみで回答してください。他のテキストは含めないでください。
{
  "tread_depth_mm": 残溝深さ（mm単位の数値。小数点1桁まで）,
  "measurement_method": "定規/デプスゲージ/目視/不明",
  "condition": "良好/要注意/交換推奨/使用不可",
  "condition_reason": "判定理由（例: 残溝4mm以上のため良好）",
  "wear_pattern": "摩耗パターンが見える場合（均一/偏摩耗/センター摩耗/ショルダー摩耗/不明）",
  "crack_visible": true/false（ひび割れが見えるか）,
  "memo": "その他気づいた点",
  "confidence": "読み取り確度 high/medium/low"
}

判定基準:
- 4mm以上: 良好
- 2mm以上4mm未満: 要注意
- 1.6mm以上2mm未満: 交換推奨
- 1.6mm未満: 使用不可（法定基準以下）

注意:
- 定規やゲージの目盛りを正確に読み取ってください
- 小数点1桁まで読み取ってください
- ひび割れ、偏摩耗なども確認してください`;

    } else if (mode === "tire_chat") {
      systemPrompt = `あなたはタイヤホテルOKABEの業務アシスタントです。
サービススタッフからの業務質問に回答します。
画像が送られた場合は、タイヤの状態判定、ナンバーからの顧客特定の補助、作業方法のアドバイスを行います。
約款の内容に基づいた回答も行います。
丁寧だが簡潔に、現場で使える回答をしてください。`;
      userPrompt = `この画像について、タイヤホテル業務の観点からアドバイスしてください。

以下のJSON形式で回答してください。
{
  "answer": "回答テキスト",
  "action_needed": "管理者への報告が必要か（yes/no）",
  "action_reason": "報告が必要な場合その理由",
  "category": "ナンバー確認/タイヤ状態/作業方法/その他"
}`;

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Use: plate_number, tire_info, tread_depth, tire_chat" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: userPrompt,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error("Claude Vision API error:", claudeRes.status, err);
      throw new Error(`Claude API returned ${claudeRes.status}`);
    }

    const claudeData = await claudeRes.json();
    const aiText = claudeData.content?.[0]?.text || "";

    let result;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result) {
      return new Response(
        JSON.stringify({ error: "読み取れませんでした。明るい場所で撮り直してみてください。", raw: aiText }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ result, mode }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: "画像解析に失敗しました。もう一度お試しください。" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
