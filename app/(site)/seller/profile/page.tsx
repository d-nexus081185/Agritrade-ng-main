import { PageHead } from "@/components/layout/DashboardShell";
import { PayoutDetailsForm } from "@/components/orders/PayoutForms";
import { SellerProfileForm } from "@/components/seller/SellerProfileForm";
import { requireSeller } from "@/lib/auth/session";
import { parseDeliveryOptions } from "@/lib/format";

export const metadata = { title: "Seller profile" };

export default async function SellerProfilePage() {
  const { profile } = await requireSeller();
  return (
    <>
      <PageHead eyebrow="Seller" title="Seller profile" description="This is what buyers see on your public seller page and listings." />
      <SellerProfileForm
        initial={{
          businessName: profile.businessName,
          description: profile.description,
          city: profile.city,
          state: profile.state,
          phone: profile.phone ?? "",
          yearsInBusiness: profile.yearsInBusiness?.toString() ?? "",
          deliveryOptions: parseDeliveryOptions(profile.deliveryOptions),
        }}
      />
      <div id="payout" style={{ marginTop: 24, scrollMarginTop: 100 }}>
        <PayoutDetailsForm
          initial={{
            payoutBankName: profile.payoutBankName ?? "",
            payoutAccountNumber: profile.payoutAccountNumber ?? "",
            payoutAccountName: profile.payoutAccountName ?? "",
          }}
        />
      </div>
    </>
  );
}
