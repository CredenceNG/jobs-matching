'use client';

import React from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function ComponentTest() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">JobAI UI Components</h1>

            {/* Button Tests */}
            <Card>
                <CardHeader>
                    <CardTitle>Button Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <Button variant="default">Default Button</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button size="sm">Small</Button>
                        <Button size="default">Default</Button>
                        <Button size="lg">Large</Button>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button loading>Loading...</Button>
                        <Button disabled>Disabled</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Input Tests */}
            <Card>
                <CardHeader>
                    <CardTitle>Input Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input label="Email" type="email" placeholder="Enter your email" />
                    <Input label="Password" type="password" placeholder="Enter your password" />
                    <Input
                        label="Search"
                        type="search"
                        placeholder="Search jobs..."
                        error="This field is required"
                    />
                </CardContent>
            </Card>

            {/* Card Variations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card padding="sm" shadow="sm">
                    <CardContent>
                        <h3 className="font-medium">Small Card</h3>
                        <p className="text-sm text-gray-600 mt-2">This is a small card with minimal padding.</p>
                    </CardContent>
                </Card>

                <Card padding="lg" shadow="lg">
                    <CardContent>
                        <h3 className="font-medium">Large Card</h3>
                        <p className="text-sm text-gray-600 mt-2">This is a large card with generous padding.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}