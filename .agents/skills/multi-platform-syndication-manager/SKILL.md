---
name: multi-platform-syndication-manager
description: >-
  Manages downstream multi-platform syndication across developer networks (Dev.to, Hashnode, Medium),
  paid industry publications ($300 - $1,500/post: LogRocket, Smashing Magazine, web.dev), and audience
  monetization engines (X visual threads, LinkedIn carousels, Substack paid newsletters, Hacker News).
  Generates tailored platform packaging while enforcing canonical URL tags.
---

# Multi-Platform Syndication Manager: The Global Amplification & Monetization Engine

A world-class engineering essay should not just exist on your personal website. When properly distributed, a single deep dive acts as a **multi-thousand-dollar asset** across paid editorial desks, subscription newsletters, and high-ticket consulting funnels.

This skill executes downstream distribution guided by `PUBLICATION_TARGETS.json`.

---

## 💰 The 3 Monetization Horizons

```mermaid
flowchart TD
  subgraph Horizon1 ["Horizon 1: Direct Payouts & Bounties ($500 - $2,500/mo)"]
    H1_1["Paid Engineering Blogs (LogRocket $350-$500, Smashing Mag $200-$400)"]
    H1_2["DevTool Vendor Contributor Programs ($500 - $1,500)"]
    H1_3["Medium Partner Program (Direct Read-Time Payouts)"]
    H1_4["X Creator Ad Revenue Sharing on High-Impression Threads"]
  end

  subgraph Horizon2 ["Horizon 2: The Substack & Media Engine ($50k - $200k+/yr)"]
    H2_1["Free Blog & Social Audience Funnel"]
    H2_2["Paid Substack Newsletter Tier ($10/mo, $100/yr)"]
    H2_3["Bestselling Self-Published System Design Guides & Ebooks"]
  end

  subgraph Horizon3 ["Horizon 3: High-Ticket Corporate Advisory ($10k - $50k+/deal)"]
    H3_1["CTO / VP Engineering Inbound Inquiries"]
    H3_2["Fractional Architecture Advisory ($300 - $600/hr)"]
    H3_3["Corporate Newsletter Sponsorships ($1,000 - $4,000/issue)"]
  end
```

---

## 📦 Syndication Package Generation (`SYNDICATION.md`)

For every published article, this skill generates `blog/posts/<slug>.syndication.md` (the `blog/articles/` tree is not part of this repo) containing:

1. **Paid Editorial Pitch Template**:
   - Ready-to-email pitch for editors at **LogRocket**, **Smashing Magazine**, or **web.dev** with an executive summary, outline, and target audience.
2. **X / Twitter Visual Thread**:
   - A 6-to-8 tweet narrative thread with high-contrast vertical diagram cards and a concluding backlink.
3. **LinkedIn ByteByteGo-Style Carousel**:
   - Slide-by-slide text and diagram breakdown designed for executive and hiring manager engagement.
4. **Dev.to & Hashnode Markdown**:
   - Pre-formatted markdown with verified YAML frontmatter including `canonical_url`.
5. **Hacker News & Lobste.rs Anchor Package**:
   - Clean, provocative, non-clickbait submission titles and the authoritative first-comment discussion starter.
6. **Substack Executive Briefing**:
   - A 5-minute Sunday morning digest format linking back to the complete canonical post.
