# Astro Blog with R2 Content Source

A static blog built with Astro that fetches content from R2 storage at build time via public URLs.

## Features

- Static site generation with Astro
- Content fetched from R2 storage at build time
- Blog listing page with cards
- Individual blog post pages with dynamic routing
- Clean, minimal CSS styling
- Responsive design

## Architecture

The blog fetches content from R2 storage at build time using the following structure:

```
R2 Bucket (via CMS):
└── content/{collection-id}/
    └── blogs/
        └── _index.json      # Contains all blog objects
```

**Index response format**:
```json
{
  "total_items": 1,
  "items": [
    {
      "id": 123,
      "name": "Blog Title",
      "slug": "blog-slug",
      "body": "Full blog content...",
      "summary": "Brief summary...",
      "status": "published",
      "created_at": "2026-02-04T19:44:28.239764+00:00",
      "updated_at": "2026-02-04T19:47:17.545400+00:00"
    }
  ]
}
```

## Setup

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Configure R2 URL**

   Copy `.env.example` to `.env` and set your R2 bucket URL:
   ```sh
   cp .env.example .env
   ```

   Edit `.env` and set the full path including your collection ID:
   ```
   PUBLIC_R2_BASE_URL=https://your-bucket.r2.dev/content/{collection-id}
   ```

   Example:
   ```
   PUBLIC_R2_BASE_URL=https://pub-bef23e577a3a45ab980c7ff10ea09781.r2.dev/content/497
   ```

3. **CMS Content**

   The blog expects your CMS to publish a `blogs/_index.json` file containing all blog posts in this format:
   ```json
   {
     "total_items": 2,
     "items": [
       {
         "name": "My First Post",
         "slug": "first-post",
         "body": "Full blog content...",
         "summary": "A brief summary"
       }
     ]
   }
   ```

## Project Structure

```
blog/
├── .env                      # Environment configuration (not in git)
├── .env.example              # Example environment file
├── astro.config.mjs          # Astro configuration
├── package.json
├── src/
│   ├── lib/
│   │   └── r2.ts            # R2 fetching utilities
│   ├── pages/
│   │   ├── index.astro      # Blog listing page
│   │   └── blog/
│   │       └── [slug].astro # Individual blog page
│   └── styles/
│       └── global.css       # Global styles
└── public/
```

## Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## Development

1. Make sure your `.env` file is configured with a valid R2 bucket URL
2. Run `npm run dev` to start the development server
3. Visit `http://localhost:4321` to see your blog
4. Click on any blog post to view the full content

## Building for Production

Run `npm run build` to generate a static site in the `./dist/` directory. All content is fetched from R2 at build time, resulting in fast, static HTML pages.

To update content, you need to rebuild the site.

## Deployment

After building, deploy the `./dist/` directory to any static hosting service (Netlify, Vercel, Cloudflare Pages, etc.).

## Notes

- Content is fetched at build time only, not at runtime
- Category data structure is available but not currently used in the UI
- To add category filtering, extend the pages to use the `fetchAllCategories()` function from `src/lib/r2.ts`
