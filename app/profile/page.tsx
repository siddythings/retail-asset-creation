'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Header } from '@/components/header/Header';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { GeneralSection } from '@/components/profile/sections/GeneralSection';
import { SecuritySection } from '@/components/profile/sections/SecuritySection';
import { NotificationsSection } from '@/components/profile/sections/NotificationsSection';

// Icons
function UserIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    );
}



const tabs = [
    { id: 'general', label: 'General', icon: <UserIcon /> },
    { id: 'security', label: 'Security', icon: <ShieldIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon /> },
    // { id: 'credentials', label: 'Credentials', icon: <KeyIcon /> },
];

export default function ProfilePage() {
    return (
        <div className="space-y-8">
            {/* Subscription Tier Section */}
            <div className="bg-card rounded-[var(--radius)] p-6 border border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
                        <div className="mt-1 flex items-center space-x-2">
                            <span className="text-2xl font-bold text-primary">Free Tier</span>
                            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                BASIC
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Upgrade to Pro for advanced features and unlimited workspaces
                        </p>
                    </div>
                    <button
                        type="button"
                        className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius)] text-sm font-medium transition-colors"
                    >
                        Upgrade Now
                    </button>
                </div>

                {/* Features List */}
                <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="flex items-center space-x-2">
                        <svg
                            className="w-4 h-4 text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-muted-foreground">1 Workspace</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <svg
                            className="w-4 h-4 text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-muted-foreground">Basic Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <svg
                            className="w-4 h-4 text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-muted-foreground">Community Support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <svg
                            className="w-4 h-4 text-muted-foreground"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-muted-foreground">Basic Integrations</span>
                    </div>
                </div>
            </div>

            {/* Credit Usage Dashboard */}
            <div className="bg-card rounded-[var(--radius)] p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Credit Usage Dashboard</h3>

                {/* Credit Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-background p-4 rounded-[var(--radius)] border border-border">
                        <div className="text-sm text-muted-foreground mb-1">Available Credits</div>
                        <div className="text-2xl font-bold text-foreground">5,000</div>
                        <div className="text-xs text-muted-foreground mt-1">of 10,000 monthly credits</div>
                    </div>

                    <div className="bg-background p-4 rounded-[var(--radius)] border border-border">
                        <div className="text-sm text-muted-foreground mb-1">Used This Month</div>
                        <div className="text-2xl font-bold text-foreground">4,832</div>
                        <div className="text-xs text-primary mt-1">48.32% of allocation</div>
                    </div>

                    <div className="bg-background p-4 rounded-[var(--radius)] border border-border">
                        <div className="text-sm text-muted-foreground mb-1">Daily Average</div>
                        <div className="text-2xl font-bold text-foreground">215</div>
                        <div className="text-xs text-muted-foreground mt-1">credits per day</div>
                    </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Usage</span>
                        <span className="text-foreground">4,832/10,000</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '48.32%' }}></div>
                    </div>
                </div>

                {/* Usage Breakdown */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-foreground">Usage Breakdown</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                <span className="text-sm text-muted-foreground">API Calls</span>
                            </div>
                            <span className="text-sm text-foreground">2,450 credits</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary/70 rounded-full"></div>
                                <span className="text-sm text-muted-foreground">Data Processing</span>
                            </div>
                            <span className="text-sm text-foreground">1,832 credits</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
                                <span className="text-sm text-muted-foreground">Storage</span>
                            </div>
                            <span className="text-sm text-foreground">550 credits</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-4 border-t border-border">
                    <button
                        type="button"
                        className="text-sm text-primary hover:text-primary/90 font-medium"
                    >
                        View Detailed Usage Analytics →
                    </button>
                </div>
            </div>
        </div>
    );
}
