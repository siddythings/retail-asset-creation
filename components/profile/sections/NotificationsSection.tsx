export function NotificationsSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Notification Preferences</h2>
      
      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-card rounded-[var(--radius)] p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Email Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Workspace Updates</p>
                <p className="text-sm text-muted-foreground">Get notified about changes in your workspaces</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="true"
                className="bg-primary relative inline-flex h-6 w-11 items-center rounded-full"
              >
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Security Alerts</p>
                <p className="text-sm text-muted-foreground">Receive notifications about security-related events</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="true"
                className="bg-primary relative inline-flex h-6 w-11 items-center rounded-full"
              >
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Newsletter</p>
                <p className="text-sm text-muted-foreground">Receive our monthly newsletter with updates</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="false"
                className="bg-muted relative inline-flex h-6 w-11 items-center rounded-full"
              >
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-card rounded-[var(--radius)] p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Push Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Desktop Notifications</p>
                <p className="text-sm text-muted-foreground">Receive notifications on your desktop</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="true"
                className="bg-primary relative inline-flex h-6 w-11 items-center rounded-full"
              >
                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sound Alerts</p>
                <p className="text-sm text-muted-foreground">Play a sound for important notifications</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked="false"
                className="bg-muted relative inline-flex h-6 w-11 items-center rounded-full"
              >
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
