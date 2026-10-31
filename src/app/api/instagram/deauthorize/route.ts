import { NextResponse, type NextRequest } from "next/server";
import { parseSignedRequest } from "@/lib/instagram/signed-request";
import { getInstagramConfig, revokeInstagramByMetaUserId } from "@/lib/instagram/service";

// "Deauthorize callback URL" do app na Meta: chamado quando a pessoa remove
// a Vyrex nas configurações do Instagram. A conexão vira "revogada" e o
// token é apagado. Sem assinatura válida, nada acontece.
export async function POST(request: NextRequest) {
  const config = getInstagramConfig();
  if (!config) return NextResponse.json({ ok: false }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get("signed_request");
  const data =
    typeof signedRequest === "string"
      ? parseSignedRequest(signedRequest, config.appSecret)
      : null;
  if (!data?.user_id) return NextResponse.json({ ok: false }, { status: 400 });

  await revokeInstagramByMetaUserId(data.user_id);
  return NextResponse.json({ ok: true });
}
