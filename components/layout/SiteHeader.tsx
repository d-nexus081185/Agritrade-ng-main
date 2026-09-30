import { getCurrentUser } from "@/lib/auth/session";
import { dashboardPathFor } from "@/lib/access";
import { HeaderNav } from "./HeaderNav";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <HeaderNav
      user={
        user
          ? {
              name: user.name,
              role: user.role,
              dashboard: dashboardPathFor(user.role),
            }
          : null
      }
    />
  );
}
