# Add a Help Article

Add a new help article to the in-app documentation system and make it discoverable via search (Cmd+K) and contextual links.

## When to Use

When adding documentation for a feature, settings page, or workflow that users need to understand.

## Steps

### 1. Add Article to Help Content

Edit `frontend/lib/help/help-content.ts`:

1. Choose the correct category (user or admin).
2. Add a new article object to the category's `articles` array:

```ts
{
  id: "my-feature",
  title: "My Feature",
  tags: ["feature", "guide", "how-to"],
  content: `# My Feature

## Overview

Brief description of the feature.

## Steps

1. First step
2. Second step

## Troubleshooting

Common issues and solutions.`,
},
```

- **id**: Unique slug (kebab-case). Used by HelpLink and search.
- **title**: Display name in the help center.
- **tags**: Keywords for the in-modal Fuse.js search.
- **content**: Markdown body. Use `#` for headings, `**bold**`, lists, etc.

For admin-only articles, add to an `adminHelpCategories` entry. For user articles, add to `userHelpCategories`.

### 2. Add Search Entry

Edit `backend/config/search-pages.php` and add an entry so the article appears in Cmd+K search:

```php
[
    'id' => 'help-my-feature',
    'title' => 'Help: My Feature',
    'subtitle' => 'Help article',
    'url' => 'help:my-feature',   // Must use help: prefix; segment after : is the article id
    'admin_only' => true,          // true if article is in adminHelpCategories
    'content' => 'feature guide how-to keywords that users might search',
],
```

- **url**: Must be `help:{article-id}`. The frontend intercepts this and opens the help modal.
- **content**: Searchable keywords. Include synonyms and related terms.

### 3. Add HelpLink to the Page

On the settings or feature page, add a contextual link:

```tsx
import { HelpLink } from "@/components/help/help-link";

<p className="text-muted-foreground">
  Configure this feature. <HelpLink articleId="my-feature" />
</p>
```

Place it in the page description, typically next to the h1.

### 4. Reindex Search

After adding the search entry:

```bash
docker-compose exec app php /var/www/html/backend/artisan search:reindex pages
```

### 5. Test

1. Open the help center (?) and verify the article appears in the correct category.
2. Use Cmd+K and search for keywords from your article; it should appear in results.
3. Click a HelpLink on the page and confirm it opens the correct article.

## Checklist

- [ ] Added article to `help-content.ts` in the correct category
- [ ] Added search entry to `search-pages.php` with `help:` URL prefix
- [ ] Set `admin_only` correctly on the search entry
- [ ] Added HelpLink to the relevant page
- [ ] Ran `search:reindex pages`
- [ ] Verified help center, search, and HelpLink all work

## Related

- [Help System Pattern](../patterns/ui-patterns.md#help-system)
- [Add searchable page](add-searchable-page.md) – For regular pages (not help articles)
