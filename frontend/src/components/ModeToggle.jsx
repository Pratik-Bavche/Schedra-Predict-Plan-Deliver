import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export function ModeToggle({ showLabel = false, className }) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size={showLabel ? "default" : "icon"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "bg-background transition-all hover:bg-accent hover:text-accent-foreground border-2 border-border shadow-sm",
        showLabel ? "w-full justify-start gap-3 h-11 px-4 rounded-xl" : "h-10 w-10 rounded-xl",
        className
      )}
    >
      <div className="relative h-5 w-5 flex items-center justify-center">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      </div>
      {showLabel && <span className="font-semibold tracking-tight">{theme === "dark" ? "Switch to Light" : "Switch to Dark"}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
