import type { Metadata } from "next";
import { AuthForm } from "@/app/components/auth-form";
import { SignupExperience } from "@/app/components/signup-showcase";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <SignupExperience>
      <AuthForm mode="signup" />
    </SignupExperience>
  );
}
