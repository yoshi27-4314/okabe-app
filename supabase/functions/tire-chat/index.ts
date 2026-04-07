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

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message is required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `あなたはタイヤホテルOKABEの業務アシスタントです。
サービススタッフや事務員からの業務質問に丁寧かつ簡潔に回答します。

タイヤホテル約款の要点:
- タイヤ及びホイールのみ預かり。ナット・センターキャップ等の付属品は不可
- 料金は車1台分（タイヤ4本セット）単位、税別
- 店舗責任の損害はタイヤ・ホイールの時価額で補償
- 期間超過は追加保管料が発生
- 天災・不可抗力による損害は免責
- 途中解約は残期間の料金返金なし

残溝判定基準:
- 良好: 4mm以上
- 要注意: 2mm以上4mm未満（次シーズンまでは使用可）
- 交換推奨: 2mm未満
- 使用不可: 1.6mm未満（法定基準）

回答は日本語で、現場で使える実用的な内容にしてください。長すぎず簡潔に。`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!claudeRes.ok) {
      const err = await claudeRes.text();
      console.error("Claude API error:", claudeRes.status, err);
      throw new Error(`Claude API returned ${claudeRes.status}`);
    }

    const claudeData = await claudeRes.json();
    const answer = claudeData.content?.[0]?.text || "";

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: "回答の生成に失敗しました。もう一度お試しください。" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
