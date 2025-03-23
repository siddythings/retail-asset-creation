'use client';

import Image from 'next/image';
// import { Header } from '@/components/header/Header';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { KeyRound, GraduationCap, CheckIcon } from 'lucide-react';

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

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75h10.5M9.75 12h10.5m-10.5 5.25h10.5M3 3.75h18M3 19.25h18" />
    </svg>
  );
}
function SurpriseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const tabs = [
  { id: 'general', label: 'General', icon: <UserIcon />, href: '/profile' },
  { id: 'credentials', label: 'Credentials', icon: <KeyRound />, href: '/profile/credentials' },
  // { id: 'security', label: 'Security', icon: <ShieldIcon />, href: '/profile/security' },
  // { id: 'notifications', label: 'Notifications', icon: <BellIcon />, href: '/profile/notifications' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, href: '/profile/settings' },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      {/* <Header /> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile Info and Navigation */}
          <div className="md:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-card rounded-[var(--radius)] p-6 shadow-[0_4px_20px_-4px] shadow-black/10 border border-border/40">
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                  <Image
                    src="/placeholder-avatar.png"
                    alt="Profile picture"
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="text-lg font-semibold text-foreground">John Doe</h2>
                <p className="text-sm text-muted-foreground">john.doe@example.com</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <ProfileTabs tabs={tabs} />
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            <div className="rounded-[var(--radius)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
