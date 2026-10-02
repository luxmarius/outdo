---
name: add-blog-post
description: Add or edit a note (blog post) on the Outdo site. Use when the owner says "write a post about…", "add a note", "publish this text".
---

# Add a note

1. File: `src/content/blog/<slug>.md`, slug lowercase with hyphens.
2. Frontmatter (all required unless noted):
   ```
   title: …
   description: one sentence shown in lists and as the page's meta description
   date: YYYY-MM-DD
   author: first name
   tags: [gear, planning, trains, routes]   # reuse existing tags where possible
   cover: /images/blog/<slug>.jpg           # optional, put the file in public/images/blog/
   draft: true                              # optional, hides it from the site
   ```
3. Body: plain markdown. `##` headings, short paragraphs, lists where useful. Write in the owners' voice:
   direct, practical, a little dry. No marketing tone.
4. If the owner gives rough notes rather than finished text, draft the post, then show it and ask before committing.
5. `npm run build` must pass.
