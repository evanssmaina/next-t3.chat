"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react"; // Import the Search icon
import { useQueryStates } from "nuqs";
import { type ChangeEvent, useCallback } from "react";
import { historyParsers } from "./search-params";

export function HistorySearch() {
  const [query, setQuery] = useQueryStates(historyParsers);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery({
      q: e.target.value,
    });
  }, []);

  const handleClear = useCallback(() => {
    setQuery({
      q: "",
    });
  }, []);

  return (
    <div className="relative w-full">
      {/* Search icon on the left */}
      <Search
        className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true" // Accessibility improvement
      />
      <Input
        value={query.q}
        onChange={handleSearchChange}
        placeholder="Search your chats...."
        className="w-full pl-8 h-11" // Add left padding for the search icon and right padding for the clear button
      />
      {query.q && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
          type="button"
          aria-label="Clear search" // Accessibility improvement
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
        </button>
      )}
    </div>
  );
}
