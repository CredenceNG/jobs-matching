import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'JobAI - AI-Powered Career Platform',
    description: 'Transform your job search with comprehensive AI tools for matching, resume optimization, cover letter generation, interview preparation, and career insights.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased bg-gray-50 text-gray-900">
                <main>{children}</main>
            </body>
        </html>
    );
}