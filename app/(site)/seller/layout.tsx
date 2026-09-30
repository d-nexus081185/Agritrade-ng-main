import { RoleDashboard } from "@/components/layout/RoleDashboard";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <RoleDashboard roles={["SELLER"]}>{children}</RoleDashboard>;
}
