"use client";

import { Input } from "@/components/ui/input";
import { useRecentsParams } from "@/hooks/use-recents-params";
import { Search, X } from "lucide-react"; // Import the Search icon
import { type ChangeEvent, useCallback } from "react";

export function SearchInput() {
  const { query, setQuery } = useRecentsParams();

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <div className="relative w-full">
      {/* Search icon on the left */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        aria-hidden="true" // Accessibility improvement
      />
      <Input
        value={query}
        onChange={handleSearchChange}
        placeholder="Search your chats...."
        className="w-full pl-10 h-12 rounded-lg" // Add left padding for the search icon and right padding for the clear button
      />
      {query && (
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
