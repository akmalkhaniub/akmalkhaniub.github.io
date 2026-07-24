# Advanced Multi-Tenant Edge Routing: Designing a middleware.ts Subdomain Engine

In multi-tenant SaaS platforms (such as platforms like Vercel, Shopify, or link shorteners like **Dub.co**), routing user requests dynamically based on the requested domain or subdomain is a fundamental requirement. 

A user visiting `tenant1.yourplatform.com/dashboard` or a custom mapped domain like `mybrand.com/link` must see the content tailored to `tenant1` silently, without the browser performing a visible redirect or showing internal path modifications (like `/tenants/tenant1/link` in the address bar).

In Next.js, this is achieved by designing a routing engine inside `middleware.ts` running on Vercel or Cloudflare **Edge Runtime**.

---

## 1. How Path Rewriting Works

Unlike a redirect (which sends an HTTP 301/302 back to the browser and updates the URL bar), a **rewrite** is a server-side alias. The server intercepts the request and fetches the response from a different folder path internally while keeping the user's visible URL intact.

```
User visits:
https://tenant-a.myplatform.com/dashboard
                      │
                      ▼
        [ Edge Middleware (middleware.ts) ]
    Resolves hostname -> internal route alias
                      │
                      ▼
Serves content internally from:
/app/platforms/[tenantId]/dashboard/page.tsx
```

---

## 2. Implementing the Subdomain Middleware

Here is a production-ready `middleware.ts` topology. To keep request times under 15ms, we query a distributed **Redis Key-Value store** via REST requests instead of making heavy SQL database connections.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Using Upstash Redis REST API for Edge compatibility
const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

async function getTenantFromDomain(hostname: string): Promise<string | null> {
  try {
    const res = await fetch(`${REDIS_REST_URL}/get/domain:${hostname}`, {
      headers: {
        Authorization: `Bearer ${REDIS_REST_TOKEN}`,
      },
      next: { revalidate: 300 }, // Cache resolution in Edge fetch cache for 5 mins
    });
    const data = await res.json();
    return data.result || null;
  } catch (error) {
    console.error("Failed to fetch tenant metadata:", error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // 1. Exclude asset folders and api routes from rewriting
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/static") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Extract subdomain details
  // Ex: app.platform.com -> core app; tenant-a.platform.com -> tenant routing
  const rootDomain = "platform.com";
  const isCustomDomain = !hostname.endsWith(rootDomain);

  let tenantId: string | null = null;

  if (isCustomDomain) {
    // Lookup which tenant owns this custom domain (e.g. mybrand.com -> tenant_99)
    tenantId = await getTenantFromDomain(hostname);
  } else {
    // Parse subdomain (e.g. tenant-a.platform.com -> tenant-a)
    const subdomain = hostname.replace(`.${rootDomain}`, "");
    
    // Ignore core app subdomains
    if (subdomain !== "app" && subdomain !== "www" && subdomain !== hostname) {
      tenantId = subdomain;
    }
  }

  // 3. Perform path rewriting if a tenant is matched
  if (tenantId) {
    // Rewrite path to our dynamic platforms folder
    // /dashboard -> /platforms/[tenantId]/dashboard
    return NextResponse.rewrite(
      new URL(`/platforms/${tenantId}${url.pathname}${url.search}`, req.url)
    );
  }

  // 4. Default: No subdomain matched, forward to main app (landing page)
  return NextResponse.next();
}
```

---

## 3. Dynamic App Folder Structure

To support the middleware rewrites, align your Next.js `/app` router file layout to match the target rewritten paths:

```text
/app
├── (marketing)           # Main website landing pages
│   ├── page.tsx
│   └── layout.tsx
├── app                   # App dashboard (app.platform.com)
│   ├── dashboard/
│   │   └── page.tsx
│   └── layout.tsx
└── platforms             # Multi-tenant directory mapping
    └── [tenantId]        # The rewritten path parameters
        ├── page.tsx      # Renders tenant home page (e.g. tenant-a.com)
        ├── dashboard/
        │   └── page.tsx  # Renders tenant dashboard (e.g. tenant-a.com/dashboard)
        └── layout.tsx    # Shared theme/layout for this specific tenant
```

---

## 4. Key Production Considerations

### A. Edge Runtime Compatibility
Next.js middleware runs on V8 isolates, meaning standard Node.js APIs (such as `net`, `child_process`, or raw TCP sockets for DB connections) are unavailable. When querying directories or config data:
* **DO:** Use HTTP-based REST API requests (like Upstash Redis REST or Supabase HTTP API) to query data.
* **DO:** Configure fetch cache intervals (`next: { revalidate }`) to cache domain mappings directly on Edge nodes, preventing database queries on every click.

### B. Custom Domain SSL Handshakes
If you allow users to point custom domains to your platform:
* You cannot handle SSL cert handshakes directly in Next.js middleware.
* **The Solution:** Offload custom domain DNS routing to proxy networks like **Cloudflare for SaaS** or **Vercel Custom Domains**. These edge proxies handle the incoming SSL handshakes and pass resolved hostname headers back to your Next.js app.
