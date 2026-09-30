import { RoleDashboard } from "@/components/layout/RoleDashboard";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <RoleDashboard>{children}</RoleDashboard>;
}
