import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing - JobAI Platform',
    description: 'Choose the perfect plan for your career advancement. Unlock premium AI features for job search, resume optimization, and career guidance.',
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}