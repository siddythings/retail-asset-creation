export function GeneralSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">General Information</h2>
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              defaultValue="John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              defaultValue="john.doe@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-foreground">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              defaultValue="San Francisco, CA"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timezone" className="text-sm font-medium text-foreground">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
              defaultValue="PST"
            >
              <option value="PST">Pacific Time (PST)</option>
              <option value="EST">Eastern Time (EST)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-foreground">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full px-3 py-2 bg-background border border-border rounded-[var(--radius)] text-foreground"
            defaultValue="Full-stack developer passionate about building great products."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[var(--radius)] text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
