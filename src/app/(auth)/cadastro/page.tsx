import type { Metadata } from "next";
import { AuthForm } from "@/app/components/auth-form";
import { SignupExperience } from "@/app/components/signup-showcase";
import { getPresentationVideoUrl } from "@/lib/site-media";

export const metadata: Metadata = { title: "Criar conta" };

// A página é montada a cada visita (o nonce da política de conteúdo exige);
// o endereço do vídeo vem de um cache de 5 min (lib/site-media.ts).

export default async function SignupPage() {
  const videoUrl = await getPresentationVideoUrl();

  return (
    <SignupExperience videoUrl={videoUrl}>
      <AuthForm mode="signup" />
    </SignupExperience>
  );
}
