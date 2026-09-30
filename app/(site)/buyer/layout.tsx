import { RoleDashboard } from "@/components/layout/RoleDashboard";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <RoleDashboard roles={["BUYER"]}>{children}</RoleDashboard>;
}
