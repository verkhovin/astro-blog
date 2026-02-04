# Building a Static Blog with Astro and Inbind CMS

A complete hands-on guide to creating a blazing-fast static blog using Astro for the frontend and Inbind CMS for content management.

## What You'll Build

By the end of this tutorial, you'll have:
- A static blog powered by Astro
- Content managed through Inbind CMS
- Content stored and served from Cloudflare R2
- Automatic deployments to GitHub Pages
- A complete CI/CD pipeline

**Live Example:** https://verkhovin.github.io/astro-blog/

## Prerequisites

- **Node.js** 18 or higher installed
- A **GitHub account**
- **Git** installed and configured
- Basic knowledge of HTML, CSS, and JavaScript
- An **Inbind CMS account** with content published to R2

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

---

## Part 1: Setting Up Inbind CMS

### Step 1: Create Your CMS Collection

1. Sign up at [Inbind](https://inbind.app) and create a new organization
2. Create a new collection called **"blogs"**
3. Add the following fields to your collection:
   - **name** (Text) - The blog post title
   - **slug** (Text) - URL-friendly identifier (e.g., "my-first-post")
   - **summary** (Text) - Brief description for the listing page
   - **body** (Rich Text/HTML) - The main content of your blog post

### Step 2: Configure R2 Publishing

4. In Inbind settings, configure your Cloudflare R2 bucket for publishing
5. Inbind will provide you with an R2 public URL that looks like:
   ```
   https://pub-xxxxxxxxx.r2.dev/content/{collection-id}/
   ```
6. **Save this URL** - you'll need it later

### Step 3: Create Your First Blog Post

7. Create a new blog post:
   - **Name:** "My First Post"
   - **Slug:** "my-first-post"
   - **Summary:** "Welcome to my new blog built with Astro and Inbind!"
   - **Body:** Write some content using the rich text editor

8. Click **Publish** - Inbind will create these files in R2:
   - `blogs/_index.json` - Index of all blog posts
   - `blogs/my-first-post.json` - Your individual blog post

### Step 4: Verify Your R2 URLs

Test that your content is accessible:

```bash
# Replace with your actual R2 URL
curl https://pub-xxxxx.r2.dev/content/{id}/blogs/_index.json

# You should see:
{
  "total_items": 1,
  "items": [{
    "id": 123,
    "slug": "my-first-post",
    "name": "My First Post",
    "summary": "Welcome to my new blog...",
    ...
  }]
}
```

The index file contains metadata, but not the full body content. The full content is in individual files:

```bash
curl https://pub-xxxxx.r2.dev/content/{id}/blogs/my-first-post.json

# You should see the same data plus:
{
  "name": "My First Post",
  "slug": "my-first-post",
  "body": "<p>Your full blog content here...</p>",
  "summary": "Welcome to my new blog...",
  ...
}
```

---

## Part 2: Building the Astro Blog

### Step 1: Initialize Astro Project

Create a new directory and initialize Astro:

```bash
mkdir my-blog
cd my-blog
npm create astro@latest . -- --template minimal --typescript strict --no-install --skip-houston
npm install
```

This creates a minimal Astro project with TypeScript.

### Step 2: Create Environment Configuration

Create `.env.example`:

```bash
cat > .env.example << 'EOF'
# R2 Storage Configuration
# Replace with your actual R2 bucket public URL
PUBLIC_R2_BASE_URL=https://your-r2-bucket.r2.dev/content/{collection-id}
EOF
```

Create `.env` with your actual URL:

```bash
cat > .env << 'EOF'
# R2 Storage Configuration
PUBLIC_R2_BASE_URL=https://pub-xxxxx.r2.dev/content/497
EOF
```

**Important:** Replace the URL with your actual R2 URL from Inbind!

### Step 3: Create Data Fetching Utilities

Create the directory:

```bash
mkdir -p src/lib
```

Create `src/lib/r2.ts`:

```typescript
// R2 Data Fetching Utilities

export interface Blog {
  name: string;
  slug: string;
  body: string;
  summary: string;
}

/**
 * Get the base R2 URL from environment variables
 */
function getR2BaseUrl(): string {
  const baseUrl = import.meta.env.PUBLIC_R2_BASE_URL;
  if (!baseUrl) {
    throw new Error('PUBLIC_R2_BASE_URL environment variable is not set');
  }
  return baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
}

/**
 * Construct a full R2 URL for a given path
 */
function getR2Url(path: string): string {
  const baseUrl = getR2BaseUrl();
  return `${baseUrl}/${path}`;
}

/**
 * Fetch all blogs from the index (CMS returns full blog objects)
 */
export async function fetchAllBlogs(): Promise<Blog[]> {
  const url = getR2Url('blogs/_index.json');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch blog index: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // CMS returns: { total_items: number, items: Blog[] }
    if (data && data.items && Array.isArray(data.items)) {
      return data.items as Blog[];
    }

    throw new Error(`Unexpected blog index format`);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
}

/**
 * Fetch a single blog by its slug from its individual JSON file
 * (includes full body content)
 */
export async function fetchBlog(slug: string): Promise<Blog> {
  const url = getR2Url(`blogs/${slug}.json`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch blog "${slug}": ${response.status} ${response.statusText}`);
    }

    const blog: Blog = await response.json();
    return blog;
  } catch (error) {
    console.error(`Error fetching blog "${slug}":`, error);
    throw error;
  }
}
```

**What this does:**
- `getR2BaseUrl()` - Reads the R2 URL from environment variables
- `getR2Url()` - Constructs full URLs for fetching content
- `fetchAllBlogs()` - Fetches the index to get all blog metadata
- `fetchBlog()` - Fetches individual blog files with full body content

### Step 4: Create Global Styles

Create the styles directory:

```bash
mkdir -p src/styles
```

Create `src/styles/global.css`:

```css
/* Global Styles */

/* Reset and Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Typography */
h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #111;
}

h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #222;
}

p {
  margin-bottom: 1rem;
}

a {
  color: #0066cc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Header */
header {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
}

header .container {
  padding: 1.5rem 1rem;
}

header h1 {
  margin-bottom: 0;
  font-size: 2rem;
}

/* Blog Listing */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.blog-card {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.blog-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.blog-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.blog-card .summary {
  color: #666;
  margin-bottom: 1rem;
}

.blog-card .read-more {
  display: inline-block;
  color: #0066cc;
  font-weight: 500;
}

/* Blog Detail */
.blog-detail {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.blog-detail .back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #0066cc;
  font-weight: 500;
}

.blog-detail h1 {
  margin-bottom: 1.5rem;
}

.blog-detail .body {
  line-height: 1.8;
  color: #444;
}

.blog-detail .body h1,
.blog-detail .body h2,
.blog-detail .body h3,
.blog-detail .body h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.blog-detail .body p {
  margin-bottom: 1rem;
}

.blog-detail .body ul,
.blog-detail .body ol {
  margin-bottom: 1rem;
  margin-left: 1.5rem;
}

.blog-detail .body li {
  margin-bottom: 0.5rem;
}

.blog-detail .body code {
  background-color: #f5f5f5;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.blog-detail .body pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.blog-detail .body pre code {
  background-color: transparent;
  padding: 0;
}

.blog-detail .body a {
  color: #0066cc;
  text-decoration: underline;
}

.blog-detail .body img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1.5rem 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  .blog-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .blog-detail {
    padding: 1.5rem;
  }
}
```

### Step 5: Create the Homepage

Edit `src/pages/index.astro`:

```astro
---
import { fetchAllBlogs } from '../lib/r2';
import '../styles/global.css';

// Fetch all blogs at build time
const blogs = await fetchAllBlogs();
const base = import.meta.env.BASE_URL;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog</title>
</head>
<body>
  <header>
    <div class="container">
      <h1>Blog</h1>
    </div>
  </header>

  <main class="container">
    <div class="blog-grid">
      {blogs.map(blog => (
        <article class="blog-card">
          <h2>
            <a href={`${base}/blog/${blog.slug}`}>{blog.name}</a>
          </h2>
          <p class="summary">{blog.summary}</p>
          <a href={`${base}/blog/${blog.slug}`} class="read-more">Read more →</a>
        </article>
      ))}
    </div>

    {blogs.length === 0 && (
      <p>No blog posts found.</p>
    )}
  </main>
</body>
</html>
```

**What this does:**
- Fetches all blogs at build time using `fetchAllBlogs()`
- Uses `import.meta.env.BASE_URL` for GitHub Pages compatibility
- Displays each blog as a card with title, summary, and link

### Step 6: Create Blog Detail Pages

Create the directory:

```bash
mkdir -p src/pages/blog
```

Create `src/pages/blog/[slug].astro`:

```astro
---
import { fetchAllBlogs, fetchBlog } from '../../lib/r2';
import '../../styles/global.css';

// Generate static paths for all blogs at build time
export async function getStaticPaths() {
  // Get the index to know which blogs exist
  const blogIndex = await fetchAllBlogs();

  // Fetch full content for each blog (including body)
  const paths = await Promise.all(
    blogIndex.map(async (indexEntry) => {
      const fullBlog = await fetchBlog(indexEntry.slug);
      return {
        params: { slug: indexEntry.slug },
        props: { blog: fullBlog }
      };
    })
  );

  return paths;
}

// Get the blog from props
const { blog } = Astro.props;
const base = import.meta.env.BASE_URL;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{blog.name} - Blog</title>
</head>
<body>
  <header>
    <div class="container">
      <h1><a href={base}>Blog</a></h1>
    </div>
  </header>

  <main class="container">
    <article class="blog-detail">
      <a href={base} class="back-link">← Back to all posts</a>
      <h1>{blog.name}</h1>
      <div class="body" set:html={blog.body}></div>
    </article>
  </main>
</body>
</html>
```

**What this does:**
- Uses `getStaticPaths()` to generate a static page for each blog post
- Fetches the full blog content (including body) for each post
- Renders the body as HTML using `set:html` directive
- All links use `BASE_URL` for GitHub Pages compatibility

### Step 7: Test Locally

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:4321` and verify:
- ✅ Homepage shows all blog posts
- ✅ Clicking a post shows the full content
- ✅ Back link works
- ✅ Styling looks good

Build for production to test:

```bash
npm run build
```

You should see output like:
```
generating static routes
▶ src/pages/blog/[slug].astro
  └─ /blog/my-first-post/index.html
▶ src/pages/index.astro
  └─ /index.html
✓ Completed in 150ms.
```

---

## Part 3: Deploying to GitHub Pages

### Step 1: Configure Astro for GitHub Pages

Edit `astro.config.mjs`:

```javascript
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://YOUR-USERNAME.github.io',
  base: '/YOUR-REPO-NAME',
});
```

Replace:
- `YOUR-USERNAME` with your GitHub username
- `YOUR-REPO-NAME` with your desired repository name (e.g., "my-blog")

**Why this is needed:** GitHub Pages project sites are served at `/repo-name/`, so Astro needs to know the base path for all links and assets.

### Step 2: Create GitHub Actions Workflow

Create the directory:

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build site
        env:
          PUBLIC_R2_BASE_URL: ${{ secrets.PUBLIC_R2_BASE_URL }}
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**What this does:**
- Triggers on every push to main/master branch
- Installs Node.js and dependencies
- Builds your site with the R2 URL from GitHub Secrets
- Deploys the generated files to GitHub Pages

### Step 3: Initialize Git and Create Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Astro blog with Inbind CMS"

# Create GitHub repository (using GitHub CLI)
gh repo create my-blog --public --source=. --remote=origin

# Push to GitHub
git push -u origin master
```

Or create the repository manually on GitHub and push:

```bash
git remote add origin https://github.com/YOUR-USERNAME/my-blog.git
git push -u origin master
```

### Step 4: Add GitHub Secret

Add your R2 URL as a secret so the build can fetch your content:

```bash
gh secret set PUBLIC_R2_BASE_URL --body "https://pub-xxxxx.r2.dev/content/497"
```

Or add it manually:
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `PUBLIC_R2_BASE_URL`
5. Value: Your R2 URL (e.g., `https://pub-xxxxx.r2.dev/content/497`)

### Step 5: Enable GitHub Pages

1. Go to your repository settings: `https://github.com/YOUR-USERNAME/my-blog/settings/pages`
2. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
3. Save

### Step 6: Trigger Deployment

The workflow will automatically run when you push. To manually trigger:

```bash
gh workflow run deploy.yml
```

Watch the deployment:

```bash
gh run watch
```

Once complete, your blog will be live at:
```
https://YOUR-USERNAME.github.io/my-blog/
```

---

## Understanding How It Works

### Build Time Flow

1. **GitHub Actions triggers** when you push code
2. **Dependencies are installed** (`npm ci`)
3. **Environment variable is set** from GitHub Secrets
4. **Astro build runs:**
   - Fetches `blogs/_index.json` from R2
   - For each blog slug, fetches `blogs/{slug}.json`
   - Generates static HTML files
   - All content is embedded in the HTML
5. **Static files are deployed** to GitHub Pages

### Runtime Flow

1. **User visits your site**
2. **GitHub Pages serves static HTML** - no API calls needed!
3. **Page loads instantly** - all content is already in the HTML
4. **Clicking links** navigates to other pre-generated static pages

### Content Update Flow

1. **Edit content in Inbind CMS**
2. **Publish** - Inbind updates the JSON files in R2
3. **Trigger rebuild:**
   ```bash
   git commit --allow-empty -m "Trigger rebuild for content update"
   git push
   ```
4. **GitHub Actions rebuilds** with new content
5. **Site updates automatically**

---

## File Structure Reference

Your final project should look like this:

```
my-blog/
├── .env                           # R2 URL (gitignored)
├── .env.example                   # Example env file
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions workflow
├── .gitignore                    # Git ignore file
├── astro.config.mjs              # Astro configuration
├── package.json                  # Dependencies
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript config
├── src/
│   ├── lib/
│   │   └── r2.ts                # Data fetching utilities
│   ├── pages/
│   │   ├── index.astro          # Blog listing page
│   │   └── blog/
│   │       └── [slug].astro     # Individual blog pages
│   └── styles/
│       └── global.css           # Global styles
└── public/                       # Static assets (favicons, etc.)
```

---

## Customization Ideas

### 1. Add a Custom Domain

In your repository settings:
1. Go to Settings → Pages
2. Add your custom domain
3. Update `site` in `astro.config.mjs` to your domain
4. Remove or adjust `base` if using a root domain

### 2. Add More Pages

Create `src/pages/about.astro`:

```astro
---
import '../styles/global.css';
const base = import.meta.env.BASE_URL;
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Blog</title>
</head>
<body>
  <header>
    <div class="container">
      <h1><a href={base}>Blog</a></h1>
    </div>
  </header>

  <main class="container">
    <article class="blog-detail">
      <h1>About</h1>
      <p>Your about page content...</p>
    </article>
  </main>
</body>
</html>
```

### 3. Add Categories

If your Inbind CMS has categories, add them to `src/lib/r2.ts`:

```typescript
export interface Category {
  name: string;
  slug: string;
}

export async function fetchAllCategories(): Promise<Category[]> {
  const url = getR2Url('categories/_index.json');
  const response = await fetch(url);
  const data = await response.json();
  return data.items;
}
```

Then create category filter pages.

### 4. Improve SEO

Add meta tags to your pages:

```astro
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content={blog.summary}>
  <meta property="og:title" content={blog.name}>
  <meta property="og:description" content={blog.summary}>
  <meta property="og:type" content="article">
  <title>{blog.name} - Blog</title>
</head>
```

### 5. Add an RSS Feed

Create `src/pages/rss.xml.js`:

```javascript
import { fetchAllBlogs } from '../lib/r2';

export async function GET() {
  const blogs = await fetchAllBlogs();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://your-username.github.io/my-blog/</link>
    <description>My blog description</description>
    ${blogs.map(blog => `
    <item>
      <title>${blog.name}</title>
      <link>https://your-username.github.io/my-blog/blog/${blog.slug}</link>
      <description>${blog.summary}</description>
    </item>
    `).join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
```

---

## Troubleshooting

### Build Fails: "Failed to fetch blog index"

**Problem:** The R2 URL is not set or incorrect.

**Solution:**
1. Check your `.env` file has the correct URL
2. Verify the GitHub Secret is set: `gh secret list`
3. Test the URL directly: `curl https://your-r2-url/blogs/_index.json`

### Links Don't Work on GitHub Pages

**Problem:** Links go to the wrong URL (missing `/my-blog` prefix).

**Solution:** All links must use `import.meta.env.BASE_URL`:
```astro
const base = import.meta.env.BASE_URL;
<a href={`${base}/blog/${slug}`}>...</a>
```

### Blog Body Is Empty

**Problem:** The body isn't showing on blog detail pages.

**Solution:** Check that:
1. `getStaticPaths()` fetches full blog content with `fetchBlog(slug)`
2. The body is rendered with `set:html`: `<div set:html={blog.body}></div>`
3. Individual blog JSON files contain the body field

### Styles Not Loading

**Problem:** CSS isn't being applied.

**Solution:**
1. Verify `import '../styles/global.css';` is in your `.astro` files
2. Check the CSS file exists at `src/styles/global.css`
3. Clear your browser cache

### GitHub Actions Failing

**Problem:** Deployment workflow fails.

**Solution:**
1. Check the workflow logs on GitHub: Actions tab
2. Verify `PUBLIC_R2_BASE_URL` secret is set
3. Ensure `package.json` has all necessary dependencies
4. Check Node version matches workflow (should be 18+)

---

## Performance Tips

### Optimize Build Time

- **Parallel fetching:** The code uses `Promise.all()` to fetch all blogs in parallel
- **Cache dependencies:** GitHub Actions caches `node_modules` automatically
- **Incremental builds:** Only rebuild when content changes

### Optimize Runtime Performance

- **Static HTML:** No JavaScript framework overhead
- **No API calls:** Content is baked into HTML at build time
- **CDN delivery:** GitHub Pages uses a global CDN
- **Lazy load images:** Add `loading="lazy"` to `<img>` tags in your body content

### Lighthouse Scores

With this setup, you should achieve:
- **Performance:** 95-100
- **Accessibility:** 90-100
- **Best Practices:** 90-100
- **SEO:** 90-100

---

## Cost Breakdown

- **Inbind CMS:** Check current pricing at [inbind.app](https://inbind.app)
- **Cloudflare R2:**
  - Free tier: 10GB storage, 10M Class A operations/month
  - Typically free for blogs
- **GitHub Pages:** Free for public repositories
- **Domain (optional):** ~$10-15/year

**Total:** As low as $0/month for a small blog!

---

## Next Steps

Now that your blog is live, consider:

1. **Content:**
   - Write more blog posts
   - Add images (upload to R2 or use a service like Cloudinary)
   - Create an About page

2. **Features:**
   - Add search functionality
   - Implement tags/categories
   - Add comments (via Disqus, Giscus, etc.)
   - Set up analytics (Plausible, Fathom, etc.)

3. **Optimization:**
   - Set up a custom domain
   - Add a sitemap
   - Implement pagination
   - Add related posts

4. **Automation:**
   - Set up webhooks to auto-rebuild when content is published
   - Add a CMS preview environment
   - Implement draft/publish workflows

---

## Resources

- **Astro Documentation:** https://docs.astro.build
- **Inbind Documentation:** https://docs.inbind.app
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **GitHub Pages Docs:** https://docs.github.com/pages
- **Example Repository:** https://github.com/verkhovin/astro-blog

---

## Conclusion

Congratulations! You've built a modern, performant blog using:
- **Astro** for ultra-fast static site generation
- **Inbind CMS** for a great content editing experience
- **Cloudflare R2** for reliable, edge-cached content storage
- **GitHub Pages** for free, reliable hosting

Your workflow is simple:
1. ✍️ Write in Inbind
2. 📤 Publish
3. 🚀 Push to GitHub (or set up auto-rebuild)
4. ✨ Site updates automatically

Happy blogging! 🎉
