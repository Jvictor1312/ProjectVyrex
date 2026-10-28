import type { Metadata } from "next";
import { AuthForm } from "@/app/components/auth-form";
import { SignupExperience } from "@/app/components/signup-showcase";
import { getPresentationVideoUrl } from "@/lib/site-media";

export const metadata: Metadata = { title: "Criar conta" };

// Página gerada com antecedência; atualizada a cada 5 minutos ou quando um
// administrador troca o vídeo (revalidatePath em actions/site.ts).
export const revalidate = 300;

export default async function SignupPage() {
  const videoUrl = await getPresentationVideoUrl();

  return (
    <SignupExperience videoUrl={videoUrl}>
      <AuthForm mode="signup" />
    </SignupExperience>
  );
}
