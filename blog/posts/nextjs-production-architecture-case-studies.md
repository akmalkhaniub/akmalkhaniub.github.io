# Next.js Production Architectures: A Comparative Study of 5 Open-Source Leaders

How do elite teams build, scale, and secure Next.js applications in production? Rather than looking at toy examples or boilerplate templates, we can learn the most by auditing the codebases of leading open-source companies. 

In this architectural deep dive, we compare 5 top open-source Next.js projects on GitHub:
1. **Midday** (`midday-ai/midday`): A financial management engine for freelancers.
2. **Dub.co** (`dubco/dub`): High-performance link management infrastructure.
3. **Cal.com** (`calcom/cal.com`): Enterprise-grade scheduling platform.
4. **Unkey** (`unkey/unkey`): Fast API key management and rate-limiting gateway.
5. **Morphic** (`miurla/morphic`): AI-powered search engine with Generative UI.

We will break down their patterns across three progressive levels: **Beginner (Structure & Routing)**, **Intermediate (Data Access & API Layers)**, and **Advanced (Edge Runtimes & Topologies)**.

---

## 1. The Beginner Layer: Repository Structure & Routing Layouts

The first decision when starting a production Next.js system is project topology: *To monorepo or not?* And how do we organize routing layers when scale increases?

```
┌────────────────────────────────────────────────────────────────────────┐
│                      WORKSPACE TOPOLOGY COMPARISON                     │
└────────────────────────────────────────────────────────────────────────┘

 [Turborepo Monorepo] (Midday, Cal.com, Unkey)
 ├── apps/
 │   ├── dashboard/   (Next.js App)
 │   └── landing-web/ (Next.js App)
 └── packages/
     ├── db/          (Shared Schema & Query Client)
     └── ui/          (Shared Component System)

 [Single Repo] (Dub.co, Morphic)
 ├── app/             (All routes: landing, dashboard, redirectors)
 ├── components/      (UI elements)
 └── lib/             (Database & Helpers)
```

### Monorepo vs. Single Repository
* **Midday, Cal.com, Unkey (Monorepos):** They use **Turborepo** to structure their codebases. In these projects, the database schema/client (`@repo/db` or `packages/prisma`), the UI component library (`@repo/ui`), and common configurations are isolated into distinct, local npm packages. This is crucial for Cal.com (which needs to share types between web embeds, scheduling pages, and mobile wrappers) and Unkey (which separates the Next.js admin dashboard from the Hono-based API engine).
* **Dub.co, Morphic (Single Repo):** They keep all code within a single, highly-focused Next.js application directory. This minimizes compilation complexity and streamlines deployment pipelines, allowing fast product iteration.

### Advanced Layout Patterns: Parallel & Intercepting Routes
When creating dashboard dialogs, traditional applications rely on client-side state hooks (`isModalOpen`). In contrast, **Midday** models modals as first-class routing paths using Next.js **Parallel Routes** (`@modal`) and **Intercepting Routes** (`(.)modal`):

```text
midday/apps/dashboard/app/(dashboard)/
├── @modal/
│   └── (..)/
│       └── transactions/
│           └── [id]/
│               └── page.tsx      <-- Renders in modal overlay when clicked
└── layout.tsx                    <-- Renders dashboard shell & {@modal} slot
```
* **Why this?** It allows users to share a direct URL to a transaction details modal. If refreshed, Next.js performs a full page render of the transaction details; if navigated from the dashboard list, it intercepts the route to display it smoothly in a sliding modal dialog overlay without losing the background scroll position.

### Hybrid Router Coexistence
**Cal.com** represents an important real-world migration blueprint. Having started in the Pages Router era, migrating to the App Router all at once was impossible. They operate a **hybrid routing model** where `/pages` and `/app` coexist:
* **The Solution:** Shared workspace packages (`@calcom/trpc` and database layers) allow pages under `/pages` and routes under `/app` to run side-by-side during incremental migration, sharing session state and UI design systems.

---

## 2. The Intermediate Layer: Data Access, ORMs, & API Boundaries

Data fetching and mutation choices directly dictate server-side latency, cold start times, and overall code maintainability.

### Database Layer: Drizzle vs. Prisma
How do these applications query databases, and what are the trade-offs?

| Project | ORM Choice | Primary Reason | Deployment Targets |
| :--- | :--- | :--- | :--- |
| **Midday** | Drizzle ORM | Serverless cold starts & SQL control | Vercel Serverless |
| **Unkey** | Drizzle ORM | Edge runtime speed & low overhead | Vercel & Cloudflare Edge |
| **Cal.com** | Prisma ORM | Deep relational schemas & migrations | Self-Hosted Docker / Node.js |
| **Dub.co** | Prisma ORM | Rich developer tooling & database sync | Vercel Serverless |

* **Why Drizzle (Unkey, Midday)?** Drizzle generates queries as direct JavaScript templates without loading a separate Rust/C++ query compiler binary. This results in minimal memory footprints, making it perfect for serverless cold-starts and **Edge Runtime** environments.
* **Why Prisma (Cal.com, Dub.co)?** Prisma provides a highly readable schema syntax, auto-generated migrations, and robust type generation. For complex enterprise databases with deep relationships (like scheduling parameters in Cal.com), the productivity gains of Prisma outweigh the serverless cold-start trade-off.

### API Boundaries: Server Actions vs. tRPC
How do frontends communicate mutations to the database?

* **Next.js Server Actions (Midday, Dub.co, Morphic):**
  Server Actions allow client forms to directly execute server-side asynchronous functions. In **Midday**, actions are defined in `actions/` files with `"use server"` headers. Zod schemas validate user input directly on the server before mutating the database:
  ```typescript
  // Example of Midday/Dub Server Action Pattern
  "use server";
  
  import { action } from "@/lib/safe-action";
  import { transactionSchema } from "./schema";
  
  export const updateTransaction = action(
    transactionSchema,
    async (data, { userId }) => {
      await db.update(transactions).set(data).where(eq(transactions.id, data.id));
      return { success: true };
    }
  );
  ```
  * **Optimistic UI:** When a user tags a transaction, Midday uses React's `useOptimistic` hook to update the client UI instantly before the Server Action completes, reverting the UI state only if the database write fails.

* **tRPC / REST Endpoints (Cal.com, Unkey):**
  Rather than calling functions directly from components, **Cal.com** defines all mutations in a unified tRPC workspace package (`@calcom/trpc`).
  * **Why?** Since Cal.com supports third-party desktop embeds and native mobile apps, Server Actions are too tightly coupled to the Next.js runtime. tRPC provides a fully decoupled, type-safe API endpoint layer accessible by any front-end client.

---

## 3. The Advanced Layer: Edge Runtimes & Topologies

At scale, Next.js moves beyond a standard web server and operates as part of a distributed system.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COMPUTE RUNTIME STRATEGY                       │
└────────────────────────────────────────────────────────────────────────┘

 [Edge Runtime] (Dub.co redirectors, Unkey gateway)
  • Runs on V8 isolates globally (Cloudflare Workers / Vercel Edge)
  • No persistent TCP connection pooling (must use HTTP/Websocket DB proxies)
  • Sub-15ms response times

 [Node.js Runtime] (Cal.com, Midday dashboard)
  • Runs on standard virtual machines / containers (AWS, GCP, Vercel Serverless)
  • Full Node.js API support (net, fs, child_process)
  • Persistent TCP database connections
```

### Edge Middleware Custom Domain Rewrites (Dub.co)
**Dub.co** leverages Next.js `middleware.ts` running on the **Edge Runtime** to handle branded short links. Every request to a custom domain (e.g. `yourbrand.co/xyz`) is routed through a single middleware file:
1. Middleware reads the request headers to extract the host (`yourbrand.co`).
2. It queries **Upstash Redis** (via REST api) to resolve the custom domain configuration and target URL.
3. It performs a lightweight URL rewrite or redirect, sending back a 307 response in under 20ms without invoking heavy serverless containers.

### Control Plane vs. Data Plane Split (Unkey)
**Unkey** implements a classic systems pattern: separating administrative management from execution pathways:
* **The Control Plane (Next.js App Router):** Manages user logins, org creations, key creation wizards, and Stripe billing. Built with standard Server Components and serverless execution.
* **The Data Plane (Cloudflare Workers + Hono):** Validates API keys at a massive scale. It is a separate, lightweight microservice running globally on Cloudflare Edge, utilizing Redis replication for instant key checks.

### Generative UI (Morphic)
Traditional AI chatbots stream text markdown which must be parsed on the client. **Morphic** changes this by streaming **interactive React components** directly from the server using Vercel's AI SDK:

```typescript
// Morphic Generative UI Flow
const result = await streamUI({
  model: openai('gpt-4o'),
  prompt: userInput,
  tools: {
    showStockChart: {
      description: 'Render stock analytics chart',
      parameters: z.object({ symbol: z.string() }),
      generate: async function* ({ symbol }) {
        yield <ChartSkeleton />; // Stream a loading skeleton UI first
        const data = await fetchStockData(symbol);
        return <StockChart data={data} />; // Stream the final interactive React element
      }
    }
  }
});
```
* **Why this?** The server controls the user interface generation. The client simply renders the streamed Node elements, keeping complex charting, computation, and third-party data fetching libraries completely off the client-side JavaScript bundle.

---

## 4. Key Architectural Takeaways

When designing your own Next.js systems, let these open-source leaders guide your choices:

1. **For high-volume edge operations:** Decouple performance-critical routes to Edge Runtime, Hono, or Cloudflare Workers, keeping Next.js App Router for complex dashboard portals (Unkey, Dub.co).
2. **For database performance:** Choose **Drizzle** if serverless cold starts or edge databases are a priority; choose **Prisma** if your system relies on deep relational queries where schema-first tooling saves dev time.
3. **For component design:** Use **Server Actions** for rapid SaaS forms to eliminate API boilerplate; use **tRPC / REST** if your backend needs to serve mobile clients or external developers.
