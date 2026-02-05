"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { type HelpCategory } from "@/lib/help/help-content";

interface HelpSidebarProps {
  categories: HelpCategory[];
  selectedCategory: string | null;
  selectedArticle: string | null;
  onSelectCategory: (categorySlug: string) => void;
  onSelectArticle: (articleId: string) => void;
  className?: string;
}

export function HelpSidebar({
  categories,
  selectedCategory,
  selectedArticle,
  onSelectCategory,
  onSelectArticle,
  className,
}: HelpSidebarProps) {
  return (
    <nav className={cn("space-y-1", className)}>
      {categories.map((category) => {
        const isExpanded = selectedCategory === category.slug;
        const hasSelectedArticle = category.articles.some(
          (a) => a.id === selectedArticle
        );

        return (
          <div key={category.slug}>
            <button
              type="button"
              onClick={() => onSelectCategory(category.slug)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isExpanded || hasSelectedArticle
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <span className="flex items-center gap-2">
                {category.icon && (
                  <category.icon className="h-4 w-4" />
                )}
                {category.name}
              </span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            </button>

            {isExpanded && (
              <div className="mt-1 ml-4 space-y-1">
                {category.articles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => onSelectArticle(article.id)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      selectedArticle === article.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
