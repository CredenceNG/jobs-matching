-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'past_due', 'paused');

-- CreateEnum
CREATE TYPE "TokenTransactionType" AS ENUM ('purchase', 'spend', 'bonus', 'refund');

-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('job_match', 'resume_analysis', 'cover_letter', 'interview_prep', 'salary_analysis', 'company_research', 'resume_optimization');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "profile_picture" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "subscription_id" VARCHAR(255),
    "subscription_status" "SubscriptionStatus",
    "subscription_end_date" TIMESTAMPTZ,
    "subscription_created_at" TIMESTAMPTZ,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "last_login" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetime_earned" INTEGER NOT NULL DEFAULT 0,
    "lifetime_purchased" INTEGER NOT NULL DEFAULT 0,
    "lifetime_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "TokenTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_packages" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "tokens" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "stripe_price_id" VARCHAR(255),
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "token_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "package_id" UUID,
    "tokens_purchased" INTEGER NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_charge_id" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feature_costs" (
    "id" UUID NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "cost_tokens" INTEGER NOT NULL,
    "description" TEXT,
    "average_api_cost_usd" DECIMAL(10,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_feature_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscription_id_key" ON "users"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_user_id_key" ON "user_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_packages_stripe_price_id_key" ON "token_packages"("stripe_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_purchases_stripe_payment_intent_id_key" ON "token_purchases"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_feature_costs_feature_key" ON "ai_feature_costs"("feature");

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_transactions" ADD CONSTRAINT "token_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_purchases" ADD CONSTRAINT "token_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "token_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
