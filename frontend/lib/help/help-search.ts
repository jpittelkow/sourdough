import Fuse, { type IFuseOptions } from "fuse.js";

export interface HelpSearchItem {
  id: string;
  title: string;
  content: string;
  category: string;
  categorySlug: string;
  tags?: string[];
}

const fuseOptions: IFuseOptions<HelpSearchItem> = {
  keys: [
    { name: "title", weight: 2 },
    { name: "content", weight: 1 },
    { name: "tags", weight: 1.5 },
    { name: "category", weight: 0.5 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

let fuseInstance: Fuse<HelpSearchItem> | null = null;

export function initializeSearch(items: HelpSearchItem[]): void {
  fuseInstance = new Fuse(items, fuseOptions);
}

export function searchHelp(query: string): HelpSearchItem[] {
  if (!fuseInstance || !query.trim()) {
    return [];
  }

  const results = fuseInstance.search(query);
  return results.map((result) => result.item);
}

export function resetSearch(): void {
  fuseInstance = null;
}
