export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Security Settings</h2>
      
      <div className="space-y-8">
        {/* Password Change */}
        <div className="bg-card rounded-[var(--radius)] p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Change Password</h3>
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium text-foreground">
                Current Password
              </label>
              <input
                type="password"
                id="current-password"
                className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirm-password"
                className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius)] text-sm font-medium transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Two Factor Authentication */}
        <div className="bg-card rounded-[var(--radius)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
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

        {/* Active Sessions */}
        <div className="bg-card rounded-[var(--radius)] p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Active Sessions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">MacBook Pro - Chrome</p>
                <p className="text-sm text-muted-foreground">San Francisco, CA • Last active 2 minutes ago</p>
              </div>
              <button className="text-sm text-destructive hover:text-destructive/90">
                Revoke
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">iPhone 13 - Safari</p>
                <p className="text-sm text-muted-foreground">San Francisco, CA • Last active 5 hours ago</p>
              </div>
              <button className="text-sm text-destructive hover:text-destructive/90">
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
