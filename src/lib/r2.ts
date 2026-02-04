// R2 Data Fetching Utilities

export interface Blog {
  name: string;
  slug: string;
  body: string;
  summary: string;
}

export interface Category {
  name: string;
  slug: string;
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

/**
 * Fetch the category index which contains a list of all category slugs
 */
export async function fetchCategoryIndex(): Promise<string[]> {
  const url = getR2Url('categories/_index.json');

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch category index: ${response.status} ${response.statusText}`);
    }

    const slugs: string[] = await response.json();
    return slugs;
  } catch (error) {
    console.error('Error fetching category index:', error);
    throw error;
  }
}

/**
 * Fetch a single category by its slug
 */
export async function fetchCategory(slug: string): Promise<Category> {
  const url = getR2Url(`categories/${slug}.json`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch category "${slug}": ${response.status} ${response.statusText}`);
    }

    const category: Category = await response.json();
    return category;
  } catch (error) {
    console.error(`Error fetching category "${slug}":`, error);
    throw error;
  }
}

/**
 * Fetch all categories by first getting the index, then fetching each category
 */
export async function fetchAllCategories(): Promise<Category[]> {
  const slugs = await fetchCategoryIndex();
  const categories = await Promise.all(slugs.map(slug => fetchCategory(slug)));
  return categories;
}
