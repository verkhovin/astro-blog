# Single-Shot Prompt for Claude Code

Copy and paste this entire prompt into Claude Code to build a complete Astro blog with Inbind CMS integration.

---

## Prerequisites

Before running this prompt:
1. Have Inbind CMS set up with a "blogs" collection
2. Know your R2 base URL (e.g., `https://pub-xxxxx.r2.dev/content/{id}/`)
3. Have at least one blog post published in Inbind

---

## The Prompt

```
I need you to build a complete Astro blog that fetches content from Inbind CMS via R2 storage.

PROJECT SETUP:
- Initialize a new Astro project with minimal template and TypeScript strict mode
- Install all dependencies

ENVIRONMENT CONFIGURATION:
- Create .env and .env.example files
- Add PUBLIC_R2_BASE_URL variable
- I'll provide the actual R2 URL after initialization

DATA STRUCTURE:
The CMS publishes JSON to R2 with this structure:
- Index file at blogs/_index.json returns: {"total_items": N, "items": [{id, slug, name, summary, ...}]}
- Individual blogs at blogs/{slug}.json include full content with "body" field containing HTML

IMPLEMENTATION:
1. Create src/lib/r2.ts with:
   - fetchAllBlogs() - fetches from blogs/_index.json and returns the items array
   - fetchBlog(slug) - fetches individual blog from blogs/{slug}.json with full body content

2. Create src/pages/index.astro:
   - Homepage that fetches all blogs at build time
   - Displays blog cards in a responsive grid
   - Each card shows: title (linked), summary, and "Read more" link
   - Links should use import.meta.env.BASE_URL for GitHub Pages compatibility

3. Create src/pages/blog/[slug].astro:
   - Dynamic route for individual blog posts
   - Use getStaticPaths() to fetch full blog content for each slug
   - Display: back link, title, and body (rendered as HTML using set:html)
   - All links should use import.meta.env.BASE_URL

4. Create src/styles/global.css with:
   - Clean, minimal design using system fonts
   - Responsive grid layout for blog cards
   - Proper HTML element styling for blog body (h1-h4, p, ul, ol, code, pre, img)
   - Mobile-responsive breakpoints

GITHUB PAGES DEPLOYMENT:
- Configure astro.config.mjs for GitHub Pages project site
- Set site to 'https://USERNAME.github.io' (I'll provide my username)
- Set base to '/REPO-NAME' (I'll provide the repo name)
- Create .github/workflows/deploy.yml with:
  - Trigger on push to main/master
  - Install Node.js, install dependencies
  - Build with PUBLIC_R2_BASE_URL from GitHub secrets
  - Deploy to GitHub Pages using actions/deploy-pages@v4

Create a comprehensive README.md explaining:
- What the project is
- The architecture (CMS -> R2 -> Astro -> GitHub Pages)
- Setup instructions
- How to configure the R2 URL
- How to deploy
- How content updates work

After you've created everything, I'll provide:
1. My actual R2 base URL for the .env file
2. My GitHub username
3. My desired repository name

Then we'll test locally, create the GitHub repo, and deploy.
```

---

## Follow-up Prompts

After Claude builds everything, provide your configuration:

### 1. Configure Your URLs

```
Here are my details:
- R2 Base URL: https://pub-xxxxx.r2.dev/content/{your-collection-id}
- GitHub Username: your-username
- Repository Name: my-blog

Please update the .env file and astro.config.mjs with these values.
```

### 2. Test Locally

```
Let's test the blog locally. Run the dev server and verify that:
1. The homepage loads and shows all blog posts
2. Clicking on a post shows the full content
3. The back link works
4. All styling looks correct
```

### 3. Deploy to GitHub Pages

```
Now let's deploy this to GitHub Pages:
1. Create the GitHub repository called "my-blog" and push the code
2. Set the PUBLIC_R2_BASE_URL GitHub secret
3. Trigger the initial deployment
4. Provide me with the live URL when it's deployed
```

### 4. Verify Deployment

```
Let's verify the deployment:
1. Check that the homepage loads at https://your-username.github.io/my-blog/
2. Test that all blog post links work correctly
3. Confirm that the back links work
4. Check the GitHub Actions workflow status
```

---

## Expected Results

After running these prompts, you'll have:

✅ A complete Astro blog with:
- Homepage listing all blog posts
- Individual blog post pages
- Responsive design
- Clean, minimal styling

✅ GitHub repository with:
- All source code
- GitHub Actions workflow
- Automated deployments

✅ Live site at:
- `https://your-username.github.io/my-blog/`

✅ Documentation:
- README with setup instructions
- Environment file examples
- Deployment guide

---

## Troubleshooting

If something doesn't work, try these follow-up prompts:

### Build Fails
```
The build is failing with error: [paste error message]
Please investigate and fix the issue.
```

### Links Don't Work
```
The links on GitHub Pages aren't working correctly. They're going to the wrong URLs.
Please check that all links are using import.meta.env.BASE_URL properly.
```

### Blog Body Not Showing
```
The blog post body isn't showing on the detail pages.
Please verify that:
1. We're fetching the full blog content in getStaticPaths
2. The body is being rendered with set:html
3. The fetchBlog function is fetching from the individual blog JSON files
```

### Styling Issues
```
The styling looks broken on [homepage/blog detail page].
Please review the CSS and fix any issues.
```

---

## Time Estimate

- **Initial build:** 2-3 minutes
- **Configuration & testing:** 5-10 minutes
- **Deployment:** 5 minutes
- **Total:** 15-20 minutes

You can have a fully functional blog deployed to GitHub Pages in under 20 minutes!

---

**Note:** This prompt was created based on the successful implementation at:
- Repository: https://github.com/verkhovin/astro-blog
- Live Demo: https://verkhovin.github.io/astro-blog/
