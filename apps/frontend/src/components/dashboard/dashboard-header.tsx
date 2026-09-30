"use client"

import { ThemeToggle } from "@/components/theme"
import { usePageHeader } from "@/shared/context/page-header-context"

export function DashboardHeader() {
  const { title, description, actions } = usePageHeader();

  return (
    <div className="bg-card border-b border-border md:pt-0 pt-16">
      <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
        <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h2>
            {description && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {actions && (
            <div className="flex items-center gap-2 flex-wrap">{actions}</div>
          )}
          <div className="fixed right-4 top-4 md:static md:right-auto md:top-auto w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 z-50">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}

