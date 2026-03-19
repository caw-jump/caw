# chrisamaya.work — Content & UX Assessment

Honest take after reviewing the live site: what works, what confuses humans, and what to fix.

---

## Would a human find the site useful?

**Yes — with caveats.** The live site has real content: clear positioning, methodology (How I Build), service menu, offer pages with concrete tech and use cases, and working forms. A technical founder or ops person looking for “someone who builds sovereign infrastructure” can understand what you do and how to contact you. The main issues are **navigation confusion** and **mismatched expectations** on a couple of links, not missing content.

---

## What’s working

- **Homepage** — Problem (Frankenstein stack) → solution (sovereign infra) → authority → form. Clear.
- **Blog** — Topic index, Sovereign Stack guide, “what I write about.” Feels substantive.
- **How I Build** — Methodology, stack choices, anti-patterns. Answers “how do you actually work?”
- **Services** — Service menu + forms. Easy to scan and act.
- **Offer pages** (e.g. Python & FastAPI) — Specific use cases, tech stack, benchmarks, CTA. Not generic.
- **Search page** — As a **topic directory** it’s useful; the content is good. Only the label is wrong (see below).
- **Contact / forms** — Visible, consistent, lead to the same “strategy session” outcome.

So: a human can get value from the site. The weak spots are clarity and consistency, not “is there anything here?”

---

## What’s confusing (and why)

### 1. Knowledge Base vs Blog

- **Nav has both:** “Blog” and “Knowledge Base.”
- **Knowledge Base** (`/knowledge-base`) shows: “Knowledge Base Has Moved” and sends people to `/blog`.
- So one nav item is effectively a redirect to the other. That’s redundant and a bit odd: “Why do I have two links that do the same thing?”

**Fix (pick one):**

- **Option A (recommended):** Remove “Knowledge Base” from the nav and keep only “Blog.” Add a **server redirect**: `/knowledge-base` → `/blog` (301), so old links and bookmarks still work. Then no one sees the “has moved” page.
- **Option B:** Keep both nav items but make “Knowledge Base” point directly to `/blog` (same as Blog). Then you don’t need the “has moved” page at all; both labels go to the same content.

### 2. “Search” doesn’t search

- **Nav:** “Search” → `/search`.
- **Page:** Topic index / quick links (“Browse by Topic,” “Jump To What You Need”). No search box.
- People who click “Search” expect a search field. They get a directory. The content is good; the label is wrong.

**Fix:**

- Rename the nav item to something like **“Topics”** or **“Explore”** or **“Content index”**, and optionally the page title to match. Then the experience matches the label.

### 3. Buttons that leave the site

- Homepage: “Calculator tools” → jumpstartscaling.com/resources/calculators.  
- “Take the full Moat Audit” → jumpstartscaling.com/audit.

These are valid choices (sister product, deeper funnel). The only risk is someone expecting everything to stay on chrisamaya.work. A small “Opens Jumpstart Scaling” or “External” hint on hover or next to the link would set expectations. Optional.

### 4. Not all buttons lead to “real content” (your words)

Audit of main CTAs:

- **INITIATE_HANDSHAKE / #audit** → Homepage form. ✅ Real.
- **Book a Call / Get in Touch / contact** → Contact page with form. ✅ Real.
- **Blog / EXPLORE_KNOWLEDGE** → Blog with topic index and articles. ✅ Real.
- **How I Build** → Methodology page. ✅ Real.
- **Services / SEE_ALL_SERVICES** → Services page. ✅ Real.
- **Python & FastAPI** (and other offer pages) → Each has its own content + form. ✅ Real.
- **Calculator tools** → External (Jumpstart). ✅ Real but off-site.
- **Moat Audit** → External (Jumpstart). ✅ Real but off-site.

So **buttons do lead to real content** — either on-site pages or a clear external destination. The only “fake” feeling is **Knowledge Base** (redirect to blog) and **Search** (directory, not search). Fix those two and the “do buttons go somewhere useful?” concern is addressed.

---

## Knowledge base “not showing”

You said the knowledge base isn’t showing. On the live site, **it does show** — but as a “Knowledge Base Has Moved” page that sends users to `/blog`. So:

- If you meant “I want a dedicated KB page with its own content” → right now that content lives under **Blog**. Either keep that and simplify nav (Option A/B above), or add a separate KB again and put different content there.
- If you meant “I added a seed and expected the same content as live” → the **live DB** has been edited (the “moved to blog” + rich blog/search content). The **repo seed** (`seed-chrisamaya.mjs`) still has the old placeholders. So:
  - **Risk:** A fresh deploy that runs the seed could **overwrite** the good live content with placeholders.
  - **Safeguard:** Either (1) stop running the full seed on deploy (e.g. only run schema, not content), or (2) update the seed file so it matches the current live content (including “moved to blog” and the real blog/search copy). Then redeploys won’t erase your work.

---

## Concrete action list

| Priority | Action |
|----------|--------|
| 1 | **Nav:** Remove “Knowledge Base” and add redirect `/knowledge-base` → `/blog` (301), **or** make both “Blog” and “Knowledge Base” point to `/blog` and remove the “has moved” page. |
| 2 | **Nav:** Rename “Search” to “Topics” or “Explore” so it matches the topic-index page. |
| 3 | **Seed vs live:** Decide: (a) seed is source of truth → update seed to match live content so deploys don’t overwrite it, or (b) live DB is source of truth → don’t run full seed on deploy (schema only, or no seed). |
| 4 | Optional: On external links (calculators, Moat Audit), add a small “(Jumpstart Scaling)” or “Opens in new tab” so users know they’re leaving the site. |

---

## Summary

- **Useful?** Yes. The site explains what you do, how you work, and how to contact you. Content is real and specific.
- **Confusing bits?** Mainly: two nav items for one destination (Blog/Knowledge Base) and “Search” that’s actually a topic index. Fix those and the experience is consistent.
- **Buttons?** They lead to real content or clear external tools; only the naming of “Search” and “Knowledge Base” makes it feel otherwise.
- **Knowledge base “not showing”?** It shows as a redirect to blog. To make that feel intentional, simplify the nav and use a proper redirect so a human never has to wonder why there are two links to the same place.
