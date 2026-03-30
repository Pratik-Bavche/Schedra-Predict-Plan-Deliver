import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle({ showLabel = false }) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size={showLabel ? "default" : "icon"}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={showLabel ? "w-full justify-start gap-2" : "h-9 w-9"}
    >
      <div className="relative h-4 w-4 flex items-center justify-center">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </div>
      {showLabel && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
