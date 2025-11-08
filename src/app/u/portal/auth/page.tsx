
import { Suspense } from "react";
import LoginPageContent from "./login-page-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - CreditWise",
  description: "Login to the Faculty Credit System.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
