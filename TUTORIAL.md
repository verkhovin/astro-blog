# Building a Static Blog with Astro, Inbind CMS, and Claude Code

A complete guide to creating a blazing-fast static blog using Astro for the frontend, Inbind CMS for content management, and Claude Code as your development assistant.

## What You'll Build

By the end of this tutorial, you'll have:
- A static blog powered by Astro
- Content managed through Inbind CMS
- Content stored and served from Cloudflare R2
- Automatic deployments to GitHub Pages
- A complete CI/CD pipeline

**Live Example:** https://verkhovin.github.io/astro-blog/

## Prerequisites

- A GitHub account
- Claude Code CLI installed ([installation guide](https://docs.anthropic.com/en/docs/claude-code))
- Basic understanding of git
- An Inbind CMS account with content published to R2

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│ Inbind CMS  │─────▶│ Cloudflare R2│─────▶│ Astro Build │
│   (Edit)    │      │  (Storage)   │      │  (Fetch)    │
└─────────────┘      └──────────────┘      └─────────────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │GitHub Pages │
                                             │   (Host)    │
                                             └─────────────┘
```

**How it works:**
1. You create and edit content in Inbind CMS
2. Inbind publishes content to Cloudflare R2 storage as JSON
3. At build time, Astro fetches content from R2 via public URLs
4. Static HTML pages are generated and deployed to GitHub Pages

## Part 1: Setting Up Inbind CMS

### Step 1: Create Your CMS Collection

1. Sign up at [Inbind](https://inbind.app) and create a new collection called "blogs"
2. Add the following fields to your collection:
   - `name` (Text) - The blog post title
   - `slug` (Text) - URL-friendly identifier (e.g., "my-first-post")
   - `summary` (Text) - Brief description for the listing page
   - `body` (Rich Text) - The main content of your blog post

### Step 2: Configure R2 Publishing

3. In Inbind settings, configure your Cloudflare R2 bucket for publishing
4. Note your R2 public URL - it will look like:
   ```
   https://pub-xxxxx.r2.dev/content/{collection-id}/
   ```

### Step 3: Create Your First Blog Post

5. Create a new blog post with:
   - **Name:** "My First Post"
   - **Slug:** "my-first-post"
   - **Summary:** "Welcome to my new blog!"
   - **Body:** Your content (supports HTML formatting)

6. Publish the post - Inbind will create these files in R2:
   - `blogs/_index.json` - List of all blog posts
   - `blogs/my-first-post.json` - Individual post content

### Step 4: Verify Your R2 URLs

Test that your content is accessible:
```bash
# Check the index
curl https://pub-xxxxx.r2.dev/content/{id}/blogs/_index.json

# Check individual post
curl https://pub-xxxxx.r2.dev/content/{id}/blogs/my-first-post.json
```

You should see JSON data for your blog posts.

## Part 2: Building the Astro Blog with Claude Code

### Step 1: Initialize Your Project

1. Create a new directory and open Claude Code:
   ```bash
   mkdir my-blog
   cd my-blog
   claude
   ```

2. Tell Claude to initialize the project:
   ```
   Create a new Astro blog project. Use the minimal template with TypeScript strict mode.
   ```

### Step 2: Set Up Environment Configuration

Ask Claude:
```
Create .env and .env.example files for storing the R2 base URL.
The variable should be called PUBLIC_R2_BASE_URL.
```

Then update your `.env` file with your actual R2 URL:
```env
PUBLIC_R2_BASE_URL=https://pub-xxxxx.r2.dev/content/{your-collection-id}
```

### Step 3: Create Data Fetching Utilities

Tell Claude:
```
Create src/lib/r2.ts with functions to fetch blog data from R2.
The CMS returns an index file with this structure:
{
  "total_items": 1,
  "items": [{ "id": 123, "slug": "post-slug", "name": "Title", "summary": "..." }]
}

Individual blog files have the full content including a "body" field with HTML.

Functions needed:
- fetchAllBlogs() - gets all blogs from the index
- fetchBlog(slug) - fetches a single blog with full content
```

### Step 4: Create the Homepage

Ask Claude:
```
Create src/pages/index.astro for the blog listing page.
It should:
- Fetch all blogs at build time
- Display them in a responsive grid of cards
- Each card shows the title, summary, and a link to the full post
- Include basic styling with src/styles/global.css
```

### Step 5: Create Blog Detail Pages

Tell Claude:
```
Create src/pages/blog/[slug].astro for individual blog posts.
It should:
- Use getStaticPaths() to generate pages for all blogs at build time
- Fetch the full blog content including the body
- Render the body as HTML (it contains HTML content)
- Include a back link to the homepage
- Display the blog title and content
```

### Step 6: Test Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:4321` to see your blog

3. Click on a post to view the full content

### Step 7: Build for Production

Test the static build:
```bash
npm run build
```

This will generate static HTML files in the `dist/` directory.

## Part 3: Deploying to GitHub Pages

### Step 1: Configure for GitHub Pages

Ask Claude:
```
Set up this project for GitHub Pages deployment to a project site.
The repository will be called "my-blog".
Configure Astro with the correct base path and create a GitHub Actions workflow.
```

Claude will:
- Update `astro.config.mjs` with site and base path
- Create `.github/workflows/deploy.yml` for automatic deployments
- Fix all internal links to use the base path

### Step 2: Create GitHub Repository

Tell Claude:
```
Create a GitHub repository called "my-blog" and push the code.
```

Or do it manually:
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create my-blog --public --source=. --remote=origin --push
```

### Step 3: Add GitHub Secrets

Add your R2 URL as a secret (so the build can access your content):
```bash
gh secret set PUBLIC_R2_BASE_URL --body "https://pub-xxxxx.r2.dev/content/{id}"
```

### Step 4: Enable GitHub Pages

1. Go to your repository settings: `https://github.com/{username}/my-blog/settings/pages`
2. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
3. Save the settings

### Step 5: Deploy

Push any commit to trigger deployment:
```bash
git push
```

Watch the deployment:
```bash
gh run watch
```

Your blog will be live at: `https://{username}.github.io/my-blog/`

## How It All Works Together

### Build Time (Automated via GitHub Actions)

1. GitHub Actions triggers on every push to `main`/`master`
2. Workflow installs Node.js and dependencies
3. Sets `PUBLIC_R2_BASE_URL` from GitHub Secrets
4. Runs `npm run build`:
   - Astro fetches `blogs/_index.json` from R2
   - For each blog, fetches the full content from `blogs/{slug}.json`
   - Generates static HTML pages with the content
5. Deploys the `dist/` folder to GitHub Pages

### Runtime (User Visits Your Site)

1. User visits `https://{username}.github.io/my-blog/`
2. GitHub Pages serves the pre-generated static HTML
3. No API calls, no database queries - instant loading!
4. Clicking a blog post loads another static HTML page

### Content Updates

1. Edit content in Inbind CMS
2. Publish changes (updates R2 JSON files)
3. Push a commit to trigger rebuild:
   ```bash
   git commit --allow-empty -m "Trigger rebuild"
   git push
   ```
4. Site rebuilds with new content and redeploys automatically

## File Structure

Your final project structure:

```
my-blog/
├── .env                           # R2 URL (not in git)
├── .env.example                   # Example env file
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions workflow
├── astro.config.mjs              # Astro config with base path
├── package.json
├── src/
│   ├── lib/
│   │   └── r2.ts                # Data fetching utilities
│   ├── pages/
│   │   ├── index.astro          # Blog listing (homepage)
│   │   └── blog/
│   │       └── [slug].astro     # Individual blog posts
│   └── styles/
│       └── global.css           # Global styles
└── public/                       # Static assets
```

## Advanced Customization

### Adding Categories

If your Inbind CMS has categories, extend the data fetching:

```typescript
// In src/lib/r2.ts
export async function fetchAllCategories(): Promise<Category[]> {
  const url = getR2Url('categories/_index.json');
  const response = await fetch(url);
  const data = await response.json();
  return data.items;
}
```

Then filter blogs by category in your pages.

### Custom Styling

Replace `src/styles/global.css` with your own design, or integrate:
- **Tailwind CSS:** `npx astro add tailwind`
- **Styled Components:** Install your preferred CSS-in-JS library

### SEO Optimization

Add meta tags to your pages:

```astro
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{blog.name} - My Blog</title>
  <meta name="description" content={blog.summary}>
  <meta property="og:title" content={blog.name}>
  <meta property="og:description" content={blog.summary}>
</head>
```

### RSS Feed

Ask Claude to create an RSS feed:
```
Create src/pages/rss.xml.js that generates an RSS feed from all blog posts
```

## Troubleshooting

### Build Fails with "Failed to fetch blog index"

**Problem:** The R2 URL is incorrect or not set.

**Solution:**
1. Verify your R2 URL in Inbind settings
2. Check the GitHub Secret is set correctly:
   ```bash
   gh secret list
   ```
3. Ensure the URL includes the full path to your collection

### Links Don't Work on GitHub Pages

**Problem:** Links go to wrong URLs (missing base path).

**Solution:** Ensure all links use `import.meta.env.BASE_URL`:
```astro
const base = import.meta.env.BASE_URL;
<a href={`${base}/blog/${slug}`}>...</a>
```

### Blog Body Is Empty

**Problem:** The `_index.json` doesn't include the full body content.

**Solution:** Fetch individual blog files in `getStaticPaths()`:
```typescript
export async function getStaticPaths() {
  const blogIndex = await fetchAllBlogs();
  const paths = await Promise.all(
    blogIndex.map(async (entry) => {
      const fullBlog = await fetchBlog(entry.slug);
      return { params: { slug: entry.slug }, props: { blog: fullBlog } };
    })
  );
  return paths;
}
```

### Local Development Works, Production Doesn't

**Problem:** Environment variable not set in GitHub.

**Solution:** Add the R2 URL as a GitHub Secret (see Step 3 in Part 3).

## Performance Considerations

### Build Time Optimization

- **Parallel Fetching:** The code uses `Promise.all()` to fetch all blogs in parallel
- **Edge Caching:** R2 automatically caches frequently accessed files
- **Incremental Builds:** Only rebuild when content changes

### Runtime Performance

- **Static HTML:** No JavaScript framework overhead
- **No API Calls:** Content is baked into HTML at build time
- **CDN Delivery:** GitHub Pages uses a global CDN
- **Lighthouse Score:** Expect 95+ scores out of the box

## Cost Analysis

- **Inbind CMS:** Check current pricing at inbind.app
- **Cloudflare R2:** Free tier includes 10GB storage and 10M Class A operations/month
- **GitHub Pages:** Free for public repositories
- **Total Monthly Cost:** As low as $0 for small blogs

## Next Steps

Now that your blog is live, you can:

1. **Add More Features:**
   - Search functionality
   - Tags and categories
   - Comments (via third-party services)
   - Analytics (Plausible, Fathom, etc.)

2. **Improve Content:**
   - Add images (store in R2 or use a CDN)
   - Create an about page
   - Add social media links

3. **Optimize Further:**
   - Add a sitemap
   - Implement pagination for blog listing
   - Add related posts suggestions
   - Set up a custom domain

4. **Share Your Work:**
   - Write about your experience
   - Share on social media
   - Contribute to the Astro community

## Resources

- **Astro Documentation:** https://docs.astro.build
- **Inbind Documentation:** https://docs.inbind.app
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **GitHub Pages Docs:** https://docs.github.com/pages
- **Claude Code Docs:** https://docs.anthropic.com/en/docs/claude-code

## Conclusion

You've built a modern, fast, and cost-effective blog using:
- **Astro** for blazing-fast static site generation
- **Inbind CMS** for easy content management
- **Cloudflare R2** for reliable content storage
- **GitHub Pages** for free hosting
- **Claude Code** as your AI development assistant

The best part? Your content workflow is simple:
1. Write in Inbind
2. Publish
3. Push a commit (or set up a webhook to auto-rebuild)
4. Your blog updates automatically!

Happy blogging! 🚀

---

**Tutorial created with Claude Code**
Repository: https://github.com/verkhovin/astro-blog
Live Demo: https://verkhovin.github.io/astro-blog/
