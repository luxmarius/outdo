import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * TRIPS
 * One folder per trip in src/content/trips/<yyyy-slug>/index.md
 * The folder name becomes the URL: /trips/<yyyy-slug>
 */
const trips = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/trips' }),
  schema: z.object({
    title: z.string(),                       // "Munich to Lake Garda"
    tagline: z.string(),                     // one line under the title
    start: z.coerce.date(),
    end: z.coerce.date(),
    countries: z.array(z.string()),          // ["Germany", "Austria", "Italy"]
    riders: z.array(z.string()),             // first names or full names
    cover: z.string(),                       // path under /public, e.g. /images/trips/2023-munich-garda/cover.jpg
    heroVideo: z.string().optional(),        // mp4 under /public (muted loop) — optional
    youtube: z.string().url().optional(),    // link to full film
    spotify: z.string().url().optional(),    // open.spotify.com track/playlist link
    gpx: z.string().optional(),              // path under /public/gpx
    days: z.array(z.object({
      title: z.string(),                     // "Munich → Imst"
      km: z.number(),
      ascent: z.number(),
      descent: z.number(),
      summary: z.string(),                   // one or two sentences
    })),
    gallery: z.array(z.object({
      src: z.string(),
      alt: z.string(),
    })).default([]),
    quote: z.object({
      text: z.string(),
      author: z.string(),
    }).optional(),
    featured: z.boolean().default(false),    // true = shown as the homepage hero
    draft: z.boolean().default(false),
  }),
});

/**
 * BLOG
 * One markdown file per post in src/content/blog/<slug>.md
 */
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** Homepage carousel: a full trip reference or a preview awaiting its story. */
const journal = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/journal' }),
  schema: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('trip'),
      trip: reference('trips'),
      order: z.number().int().nonnegative(),
    }),
    z.object({
      kind: z.literal('preview'),
      title: z.string(),
      place: z.string(),
      cover: z.string(),
      coverAlt: z.string(),
      order: z.number().int().nonnegative(),
    }),
  ]),
});

/** Route sketches for the globe while a trip's full story is being collected.
 * Remove the sketch when the corresponding trip and GPX are published.
 */
const routes = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/routes' }),
  schema: z.object({
    title: z.string(),
    countries: z.array(z.string()).min(1),
    points: z.array(z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ])).min(2),
    journal: reference('journal').optional(),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { trips, blog, journal, routes };
