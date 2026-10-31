import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { parseSignedRequest } from "@/lib/instagram/signed-request";
import { getInstagramConfig, revokeInstagramByMetaUserId } from "@/lib/instagram/service";

// "Data deletion request URL" do app na Meta. Na hora: a conexão é revogada
// e o token apagado. As métricas já consultadas fazem parte do cadastro e
// seguem o processo de privacidade da Vyrex (pedido tratado pela equipe em
// /interno/privacidade). A Meta espera { url, confirmation_code }.
export async function POST(request: NextRequest) {
  const config = getInstagramConfig();
  if (!config) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get("signed_request");
  const data =
    typeof signedRequest === "string"
      ? parseSignedRequest(signedRequest, config.appSecret)
      : null;
  if (!data?.user_id) return NextResponse.json({ error: "invalid" }, { status: 400 });

  await revokeInstagramByMetaUserId(data.user_id);
  const confirmationCode = randomBytes(9).toString("base64url");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  return NextResponse.json({
    url: `${siteUrl}/privacidade?pedido-meta=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
