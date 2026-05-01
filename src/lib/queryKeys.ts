export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  apps: {
    all: ["apps"] as const,
    detail: (id: string | number) => ["apps", id.toString()] as const,
    keys: (appId: string | number) => ["apps", appId.toString(), "keys"] as const,
    providers: (appId: string | number) => ["apps", appId.toString(), "providers"] as const,
  },
  health: ["health"] as const,
};
