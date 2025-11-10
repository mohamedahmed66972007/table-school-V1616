
import { Plus, X } from "lucide-react";
import type { ScheduleSlotData } from "@/types/schedule";
import { Input } from "./ui/input";

interface ScheduleCellProps {
  slot?: ScheduleSlotData;
  onClick?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
  onValueChange?: (value: string) => void;
  value?: string;
}

export default function ScheduleCell({ 
  slot, 
  onClick, 
  onDelete, 
  readOnly,
  onValueChange,
  value 
}: ScheduleCellProps) {
  // If using direct input mode (for teacher schedule)
  if (onValueChange !== undefined) {
    return (
      <div className="relative w-full h-20 group">
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder=""
          className="w-full h-full text-center text-lg font-bold font-data p-2"
          disabled={readOnly}
          dir="ltr"
        />
        {!readOnly && value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onValueChange("");
            }}
            className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive/90"
            title="حذف الحصة"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Original mode (for class schedule - read only)
  if (!slot) {
    return (
      <button
        onClick={onClick}
        disabled={readOnly}
        className={`w-full h-20 flex items-center justify-center ${
          !readOnly ? 'hover:bg-muted/50 active:bg-muted/70 cursor-pointer' : 'cursor-default'
        } transition-colors duration-150 border border-dashed border-border/30`}
        data-testid="button-empty-slot"
      >
        {!readOnly && <Plus className="h-5 w-5 text-muted-foreground" />}
      </button>
    );
  }

  return (
    <div className="relative w-full h-20 group">
      <button
        onClick={onClick}
        disabled={readOnly}
        className={`w-full h-full p-3 flex flex-col items-center justify-center gap-1 bg-primary/10 ${
          !readOnly ? 'hover:bg-primary/15 active:bg-primary/20 cursor-pointer' : 'cursor-default'
        } transition-colors duration-150`}
        data-testid={`button-filled-slot-${slot.grade}-${slot.section}`}
      >
        <div className="text-lg font-bold font-data text-primary">
          {slot.grade}/{slot.section}
        </div>
        <div className="text-xs text-muted-foreground font-accent">
          الصف {slot.grade} - الشعبة {slot.section}
        </div>
      </button>
      {!readOnly && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-destructive/90"
          title="حذف الحصة"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
