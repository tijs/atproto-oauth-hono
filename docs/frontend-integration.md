# Frontend Integration Guide

Learn how to integrate AT Protocol OAuth authentication in your React frontend when using `@tijs/atproto-oauth-hono`.

## Overview

The OAuth package provides a cookie-based authentication system. Your frontend needs to:
1. Check authentication status using the `/api/auth/session` endpoint
2. Redirect users to `/login?handle=...` for authentication
3. Include cookies in all API requests using `credentials: "include"`

## React Authentication Hook

Here's a complete authentication hook for React:

```typescript
/** @jsxImportSource https://esm.sh/react */
import { useState, useEffect } from "https://esm.sh/react";

interface AuthState {
  isAuthenticated: boolean;
  user?: {
    did: string;
    handle: string;
    pdsUrl: string;
  };
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
  });

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include", // Important: include cookies
      });

      const data = await response.json();

      if (data.valid && data.did) {
        setAuthState({
          isAuthenticated: true,
          user: {
            did: data.did,
            handle: data.handle || "",
            pdsUrl: data.pdsUrl || "",
          },
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
      setAuthState({
        isAuthenticated: false,
        loading: false,
      });
    }
  };

  // Login function
  const login = (handle: string) => {
    // Redirect to OAuth package's login endpoint
    globalThis.location.href = `/login?handle=${encodeURIComponent(handle)}`;
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });
      setAuthState({
        isAuthenticated: false,
        loading: false,
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshAuth: checkAuth,
  };
}
```

## Login Component

```typescript
/** @jsxImportSource https://esm.sh/react */
import React, { useState } from "https://esm.sh/react";

interface LoginProps {
  onLogin: (handle: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    onLogin(handle.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Login with AT Protocol
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Bluesky Handle
            </label>
            <input
              type="text"
              id="handle"
              value={handle}
              onChange={(e) => setHandle((e.target as HTMLInputElement).value)}
              placeholder="your-handle.bsky.social"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !handle.trim()}
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Login with Bluesky"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Main App Component

```typescript
/** @jsxImportSource https://esm.sh/react */
import React from "https://esm.sh/react";
import { useAuth } from "./useAuth.ts";
import { Login } from "./Login.tsx";

export function App() {
  const { isAuthenticated, user, loading, login, logout } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  // Main authenticated app
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              My AT Protocol App
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as: {user?.handle}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <YourAppContent />
      </main>
    </div>
  );
}

function YourAppContent() {
  // Your authenticated app content here
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Welcome to your app!</h2>
      <p className="text-gray-600">
        You are successfully authenticated with AT Protocol OAuth.
      </p>
    </div>
  );
}
```

## Making Authenticated API Calls

When making API calls to your backend, always include `credentials: "include"`:

```typescript
// ✅ Correct - includes cookies for authentication
const fetchUserData = async () => {
  const response = await fetch("/api/user-data", {
    credentials: "include", // Required for cookie-based auth
  });

  if (response.ok) {
    return await response.json();
  }

  if (response.status === 401) {
    // User is no longer authenticated
    // Trigger re-authentication or redirect to login
  }

  throw new Error("Failed to fetch user data");
};

// For POST/PUT requests
const updateData = async (data: any) => {
  const response = await fetch("/api/update", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Required for cookie-based auth
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Update failed");
  }

  return await response.json();
};
```

## Error Handling

Handle common authentication scenarios:

```typescript
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Always include cookies
  });

  if (response.status === 401) {
    // Session expired or invalid
    // Redirect to login or refresh auth state
    globalThis.location.href = "/";
    return;
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response;
};
```

## Key Points

### 1. Always Use `credentials: "include"`
```typescript
// ✅ Correct
fetch("/api/endpoint", { credentials: "include" });

// ❌ Wrong - cookies won't be sent
fetch("/api/endpoint");
```

### 2. No Custom Headers Needed
```typescript
// ✅ Simple and correct
const response = await fetch("/api/data", {
  credentials: "include",
});

// ❌ No longer needed with cookie-based auth
const response = await fetch("/api/data", {
  headers: {
    "Authorization": "Bearer ...",
    "X-Session-Data": "...",
  },
});
```

### 3. Use the Built-in Session Endpoint
```typescript
// ✅ Use the provided session endpoint
const authStatus = await fetch("/api/auth/session", {
  credentials: "include",
});

// ❌ Don't try to manage sessions manually
const session = localStorage.getItem("session");
```

### 4. Handle Login via Redirect
```typescript
// ✅ Simple redirect to OAuth package's login
globalThis.location.href = `/login?handle=${handle}`;

// ❌ Don't try to implement OAuth flow manually
fetch("/api/auth/start", { ... });
```

## Common Patterns

### Protecting Routes
```typescript
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return <>{children}</>;
}
```

### Auto-refresh Authentication
```typescript
// Check auth status periodically (optional)
useEffect(() => {
  const interval = setInterval(checkAuth, 5 * 60 * 1000); // Every 5 minutes
  return () => clearInterval(interval);
}, []);
```

This approach leverages the OAuth package's built-in session management and provides a clean, secure authentication flow for your frontend.