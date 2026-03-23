"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "./ui/button"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fcs.egspgroup.in';

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

type SearchCategory = {
  category: string;
  items: SearchItem[];
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchCategory[]>([])
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid')

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (query.length <= 2) {
      setResults([])
      setLoading(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      const token = localStorage.getItem("token")
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.success) {
          setResults(data.results || [])
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const onSelect = React.useCallback((url: string) => {
    setOpen(false)
    setQuery("")
    
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
        if (uid && !targetUrl.includes('uid=')) {
            targetUrl += targetUrl.includes('?') ? `&uid=${uid}` : `?uid=${uid}`;
        }
    }
    
    router.push(targetUrl)
  }, [router, uid])

  return (
    <>
      <div className="flex items-center w-full">
        <button
          onClick={() => setOpen(true)}
          className="hidden md:flex relative w-full max-w-sm items-center group focus:outline-none"
          type="button"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
          <div className="w-full h-10 bg-background/20 text-muted-foreground/80 pl-10 pr-4 rounded-none border border-sidebar-border text-sm flex items-center justify-between group-hover:bg-background/30 group-hover:text-sidebar-foreground transition-all">
            <span>Search users, credits...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </button>
        {/* Mobile Trigger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden h-10 w-10 rounded-none hover:bg-cds-ui-01"
          onClick={() => setOpen(true)}
        >
          <Search className="h-5 w-5 text-cds-text-02" />
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type to search..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          )}
          {!loading && query.length > 2 && results.length === 0 && (
            <CommandEmpty>No results found for "{query}".</CommandEmpty>
          )}
          {!loading && query.length <= 2 && (
            <div className="p-4 text-center text-sm text-muted-foreground font-medium">
              Enter at least 3 characters to search
            </div>
          )}
          
          {results.map((group, groupIndex) => (
            <React.Fragment key={group.category}>
              {groupIndex > 0 && <CommandSeparator />}
              <CommandGroup heading={group.category}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.title} ${item.subtitle} ${group.category}`}
                    onSelect={() => onSelect(item.url)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">{item.title}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}