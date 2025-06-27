import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DateRange } from "react-day-picker"
import {
  startOfDay,
  format,
  differenceInCalendarDays,
} from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/** --------------------------------------------------------------------------
 * 🔒 Hardened date‑range validator
 * ---------------------------------------------------------------------------
 *
 * ‑ Guards against malformed input (non‑Date, invalid Date, NaN dates).
 * ‑ Rejects huge spans (default 366 nights) to thwart DOS‑style abuse.
 * ‑ Ensures the stay does **not** start on a booked check‑in *and*
 *   does not cross *any* booked check‑in in its interior.
 * ‑ Always returns an *object*; never throws—internal errors are captured
 *   and surfaced via { valid:false, reason }. This prevents crashes from
 *   propagating into React or other callers.
 * -------------------------------------------------------------------------- */

export interface ValidateResult {
  /** If `false`, read `reason` for user‑facing error text. */
  valid: boolean
  /** Localisable, human‑friendly explanation for invalid selections. */
  reason?: string
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime())
}

const dayToOrdinal = (d: Date) => startOfDay(d).getTime() / 86_400_000 // ms→days

export function validateStayRange(
  candidate: DateRange,
  bookedCheckIns: readonly Date[],
  opts: { maxStayDays?: number } = {}
): ValidateResult {
  const { maxStayDays = 15 } = opts
  try {
    /* --------------------------------------------------------------------- */
    // 1. Basic presence & type safety
    /* --------------------------------------------------------------------- */
    if (!candidate.from) {
      return { valid: false, reason: "Please select an arrival date." }
    }

    if (!isValidDate(candidate.from)) {
      return { valid: false, reason: "Arrival date is not a valid day." }
    }

    const from = startOfDay(candidate.from)
    const to = startOfDay(candidate.to ?? candidate.from) // 1‑night fallback

    if (!isValidDate(to)) {
      return { valid: false, reason: "Departure date is not a valid day." }
    }

    // 2. Logical ordering
    if (differenceInCalendarDays(to, from) < 0) {
      return { valid: false, reason: "Departure precedes arrival." }
    }

    // 3. Sanity‑limit for enormous spans (prevents UI hangs / DOS)
    if (differenceInCalendarDays(to, from) > maxStayDays) {
      return {
        valid: false,
        reason: `Maximum stay is ${maxStayDays} days. Please select a shorter period.`,
      }
    }

    /* --------------------------------------------------------------------- */
    // 4. Build a *constant‑time* lookup of reserved check‑in ordinals.
    //    Using a Set keeps per‑date checks O(1).
    /* --------------------------------------------------------------------- */
    const reserved = new Set<number>()
    for (const d of bookedCheckIns) {
      if (isValidDate(d)) reserved.add(dayToOrdinal(d))
    }

    // 5. Rule: arrival cannot sit on someone else's check‑in
    if (reserved.has(dayToOrdinal(from))) {
      return {
        valid: false,
        reason: "That day is reserved for another guest's check‑in.",
      }
    }

    // 6. Rule: interior days cannot contain anyone else's arrival
    for (
      let ord = dayToOrdinal(from) + 1, ordEnd = dayToOrdinal(to);
      ord < ordEnd;
      ord++
    ) {
      if (reserved.has(ord)) {
        return {
          valid: false,
          reason: "Your stay crosses another guest's arrival.",
        }
      }
    }

    // 7. Check‑out is always allowed—even on someone else's arrival day.
    return { valid: true }
  } catch (err: unknown) {
    // Defensive: capture *all* runtime errors and surface as invalid.
    return {
      valid: false,
      reason: `Unexpected validation error – ${(err as Error)?.message ?? err}`,
    }
  }
}

/** --------------------------------------------------------------------------
 * Calendar Component – front‑end only, no network calls
 * -------------------------------------------------------------------------- */
export interface CalendarProps
  extends Omit<React.ComponentProps<typeof DayPicker>, "mode" | "selected"> {
  bookedCheckIns?: Date[]
  onValidRangeSelect?: (range: DateRange) => void
}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      className,
      classNames,
      bookedCheckIns = [],
      onValidRangeSelect,
      ...props
    },
    ref
  ) => {
    const [range, setRange] = React.useState<DateRange | undefined>()
    const [error, setError] = React.useState<string>("")

    /* --------------------------------------------------------------------- */
    // Memoised list of reserved *ordinals* – used for UI highlighting only.
    /* --------------------------------------------------------------------- */
    const reservedOrdinals = React.useMemo(
      () => bookedCheckIns.map(dayToOrdinal),
      [bookedCheckIns]
    )

    /* --------------------------------------------------------------------- */
    // Selection handler – pipes pick to validator and updates UI state.
    /* --------------------------------------------------------------------- */
    const handleSelect = React.useCallback(
      (sel: DateRange | undefined) => {
        if (!sel) {
          setRange(undefined)
          setError("")
          return
        }

        const verdict = validateStayRange(sel, bookedCheckIns)
        if (verdict.valid) {
          setRange(sel)
          setError("")
          onValidRangeSelect?.(sel)
        } else {
          setRange(sel)
          setError(verdict.reason ?? "Invalid selection.")
        }
      },
      [bookedCheckIns, onValidRangeSelect]
    )

    /* --------------------------------------------------------------------- */
    // UI helpers
    /* --------------------------------------------------------------------- */
    const navIcons = React.useMemo(
      () => ({
        IconLeft: (p: React.ComponentProps<"svg">) => (
          <ChevronLeft className="h-4 w-4" {...p} />
        ),
        IconRight: (p: React.ComponentProps<"svg">) => (
          <ChevronRight className="h-4 w-4" {...p} />
        ),
      }),
      []
    )

    const renderDay = React.useCallback(
      (date: Date) => {
        const dayNumber = format(date, "d")
        const onlyCheckout = reservedOrdinals.includes(dayToOrdinal(date))
        return (
          <div className="flex flex-col items-center">
            <span>{dayNumber}</span>
            {onlyCheckout && (
              <span className="text-[8px] leading-none mt-0.5">
                only check‑out
              </span>
            )}
          </div>
        )
      },
      [reservedOrdinals]
    )

    /* --------------------------------------------------------------------- */
    // Render
    /* --------------------------------------------------------------------- */
    return (
      <>
        <DayPicker
          mode="range"
          selected={range}
          showOutsideDays
          disabled={(date) => {
            const today = startOfDay(new Date())
            const isPastDate = date < today
            const isReservedCheckIn = !range?.from && reservedOrdinals.includes(dayToOrdinal(date))
            return isPastDate || isReservedCheckIn
          }}
          modifiers={{
            checkoutOnly: bookedCheckIns,
          }}
          modifiersClassNames={{
            checkoutOnly: "opacity-80 !bg-accent/30 !text-foreground",
          }}
          components={navIcons}
          className={cn("p-3 w-full max-w-full", className)}
          classNames={{
            /* …tailwind class map unchanged… */
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
            month: "space-y-4 w-full max-w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1 max-w-full",
            head_row: "flex w-full",
            head_cell:
              "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] min-w-0",
            row: "flex w-full mt-2",
            cell: "flex-1 min-w-0 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "aspect-square w-full p-0 font-normal aria-selected:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95 min-w-0 text-xs"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-blue-400 text-white hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white",
            day_today: "bg-accent text-accent-foreground",
            day_outside:
              "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-blue-200 aria-selected:text-blue-900",
            day_hidden: "invisible",
            ...classNames,
          }}
          onSelect={handleSelect}
          {...props}
        />

        {!!error && (
          <p className="mt-2 text-sm text-destructive font-medium">{error}</p>
        )}
      </>
    )
  }
)

Calendar.displayName = "Calendar"