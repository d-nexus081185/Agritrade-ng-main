import { RoleDashboard } from "@/components/layout/RoleDashboard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleDashboard roles={["ADMIN"]}>{children}</RoleDashboard>;
}
