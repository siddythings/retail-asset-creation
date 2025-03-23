import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProfileTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface ProfileTabsProps {
  tabs: ProfileTab[];
}

export function ProfileTabs({ tabs }: ProfileTabsProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-[var(--radius)] transition-colors ${
            pathname === tab.href
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <span className="w-5 h-5">{tab.icon}</span>
          <span className="font-medium">{tab.label}</span>
        </Link>
      ))}
    </div>
  );
}
