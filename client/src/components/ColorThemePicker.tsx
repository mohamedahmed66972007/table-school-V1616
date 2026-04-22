import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLOR_THEMES, useColorTheme, type ColorThemeId } from "@/lib/scheduleConfig";

export function ColorThemePicker() {
  const [active, setActive] = useColorTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="transition-all duration-200" title="اختيار اللون">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">اختيار اللون</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-right">اللون الرئيسي</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COLOR_THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setActive(t.id as ColorThemeId)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: t.color }}
              />
              <span>{t.label}</span>
            </div>
            {active === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
