-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN "payoutAccountName" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN "payoutAccountNumber" TEXT;
ALTER TABLE "SellerProfile" ADD COLUMN "payoutBankName" TEXT;

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "inquiryId" TEXT,
    "productId" TEXT,
    "productTitle" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "deliveryFee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "sellerAmount" INTEGER NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "paymentProvider" TEXT,
    "paymentRef" TEXT,
    "disputeReason" TEXT,
    "payoutStatus" TEXT NOT NULL DEFAULT 'NONE',
    "payoutRef" TEXT,
    "paidAt" DATETIME,
    "shippedAt" DATETIME,
    "completedAt" DATETIME,
    "refundedAt" DATETIME,
    "cancelledAt" DATETIME,
    "paidOutAt" DATETIME,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentRef_key" ON "Order"("paymentRef");

-- CreateIndex
CREATE INDEX "Order_buyerId_status_idx" ON "Order"("buyerId", "status");

-- CreateIndex
CREATE INDEX "Order_sellerId_status_idx" ON "Order"("sellerId", "status");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_payoutStatus_idx" ON "Order"("payoutStatus");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_idx" ON "OrderEvent"("orderId");
