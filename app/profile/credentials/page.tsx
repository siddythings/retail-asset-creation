"use client";

import { useState } from "react";

interface PlatformAccount {
  id: string;
  email: string;
  connected: string;
  lastSync: string;
  status: "connected" | "disconnected" | "expired";
  isDefault: boolean;
}

interface Platform {
  id: string;
  name: "gmail" | "google_drive" | "google_sheets" | "dropbox" | "slack" | "notion" | "github" | "jira" | "asana" | "microsoft_teams";
  displayName: string;
  accounts: PlatformAccount[];
}

interface PlatformPermission {
  name: string;
  description: string;
  required: boolean;
}

interface PlatformInfo {
  id: string;
  name: Platform["name"];
  displayName: string;
  description: string;
  permissions: PlatformPermission[];
  category: "communication" | "storage" | "productivity" | "development";
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function CredentialsPage() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<{ key: string, name: string } | null>(null);

  // Example API keys data - in real app, this would come from your API
  const apiKeys: ApiKey[] = [
    {
      id: "key_1",
      name: "Development API Key",
      key: "sk_dev_123...abc",
      createdAt: "2024-03-15T10:00:00Z",
      lastUsed: "2024-03-20T15:30:00Z"
    },
    {
      id: "key_2",
      name: "Production API Key",
      key: "sk_prod_456...xyz",
      createdAt: "2024-03-10T08:00:00Z",
      lastUsed: null
    }
  ];

  return (
    <div className="space-y-6">
      {/* API Keys Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-1 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">API Keys</h2>
              <p className="text-sm text-muted-foreground">
                Manage API keys to authenticate your applications
              </p>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create API Key
            </button>
          </div>
        </div>

        <div className="divide-y divide-border">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {apiKey.key}
                    </code>
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                    </span>
                    {apiKey.lastUsed && (
                      <>
                        <span className="text-muted-foreground/60">•</span>
                        <span className="text-sm text-muted-foreground">
                          Last used {new Date(apiKey.lastUsed).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  // Handle revoke
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-500/10 text-red-600 hover:bg-red-500/20 h-8 px-3"
              >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-border bg-background shadow-lg rounded-[var(--radius)] duration-200">
            <div className="p-6 space-y-4">
              {showNewKey ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">API Key Created</h3>
                    <p className="text-sm text-muted-foreground">
                      Your new API key has been created. Please copy it now - you won't be able to see it again!
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <div className="mt-1 text-sm">{showNewKey.name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">API Key</label>
                      <div className="mt-1 relative">
                        <code className="text-xs bg-background p-2 rounded block break-all">
                          {showNewKey.key}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(showNewKey.key);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Create API Key</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a new API key to authenticate your applications
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Key Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Development API Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="border-t border-border p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setShowNewKey(null);
                  setNewKeyName("");
                }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4"
              >
                {showNewKey ? "Done" : "Cancel"}
              </button>
              {!showNewKey && (
                <button
                  onClick={() => {
                    // In a real app, this would call your API to create a new key
                    setShowNewKey({
                      name: newKeyName,
                      key: "sk_test_" + Math.random().toString(36).substring(2, 15)
                    });
                  }}
                  disabled={!newKeyName}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4"
                >
                  Create Key
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}