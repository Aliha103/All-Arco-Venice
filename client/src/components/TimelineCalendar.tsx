import React, { useState, useEffect } from "react";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  differenceInCalendarDays,
  addDays,
  isSameDay,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Helper: returns an array of all days within the visible month interval
 */
const useMonthDays = (currentMonth: Date) => {
  return eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
};

/**
 * Represents one booking / block on the calendar
 */
interface Booking {
  id: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  type: "manual" | "blocked";
  price: number;
  paymentMethod?: string;
}

interface FormState {
  mode: "blocked" | "manual";
  guestName: string;
  price: number;
  paymentMethod: string;
}

const CELL_WIDTH = 120; // px — width of one day cell
const CELL_HEIGHT = 32; // px — height of timeline row

interface TimelineCalendarProps {
  month?: Date;
}

export default function TimelineCalendar({
  month = new Date(),
}: TimelineCalendarProps) {
  const days = useMonthDays(month);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing bookings
  const { data: bookingsData = [] } = useQuery({
    queryKey: ["/api/bookings"],
  });

  // Transform booking data to match component format
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const transformedBookings = (bookingsData as any[]).map((booking: any) => ({
      id: booking.id.toString(),
      guestName: booking.guestFirstName + " " + booking.guestLastName,
      checkIn: new Date(booking.checkInDate),
      checkOut: new Date(booking.checkOutDate),
      type: "manual" as const,
      price: booking.totalPrice || 0,
      paymentMethod: booking.paymentMethod || "unknown",
    }));
    setBookings(transformedBookings);
  }, [bookingsData]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formState, setFormState] = useState<FormState>({
    mode: "blocked", // "blocked" | "manual"
    guestName: "",
    price: 0,
    paymentMethod: "cash",
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleCellClick = (day: Date) => {
    setSelectedDate(day);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;

    if (formState.mode === "blocked") {
      // Create a blocked booking
      const blockData = {
        guestFirstName: "Blocked",
        guestLastName: "Date",
        guestEmail: "blocked@system.com",
        guestCountry: "System",
        guestPhone: "000-000-0000",
        checkInDate: format(selectedDate, "yyyy-MM-dd"),
        checkOutDate: format(addDays(selectedDate, 1), "yyyy-MM-dd"),
        guests: 1,
        paymentMethod: "property",
        createdBy: "admin",
        blockReason: "Manual block",
      };
      createBookingMutation.mutate(blockData);
    } else {
      // Create a manual booking
      const bookingData = {
        guestFirstName: formState.guestName.split(" ")[0] || "Manual",
        guestLastName: formState.guestName.split(" ").slice(1).join(" ") || "Booking",
        guestEmail: "manual@booking.com",
        guestCountry: "Manual Entry",
        guestPhone: "000-000-0000",
        checkInDate: format(selectedDate, "yyyy-MM-dd"),
        checkOutDate: format(addDays(selectedDate, 1), "yyyy-MM-dd"),
        guests: 1,
        paymentMethod: formState.paymentMethod,
        createdBy: "admin",
      };
      createBookingMutation.mutate(bookingData);
    }

    setDialogOpen(false);
    setFormState({ mode: "blocked", guestName: "", price: "0", paymentMethod: "cash" });
  };

  /**
   * Compute inline style for a booking bar — left offset & width
   */
  const getBookingStyle = (booking: Booking) => {
    const startIdx = differenceInCalendarDays(booking.checkIn, days[0]);
    const endIdx = differenceInCalendarDays(booking.checkOut, days[0]);
    const nights = Math.max(endIdx - startIdx, 0);

    // Half‑width for first day (check‑in) & last day (check‑out)
    const width = nights * CELL_WIDTH + CELL_WIDTH / 2; // nights full + first half
    const left = startIdx * CELL_WIDTH + CELL_WIDTH / 2; // start half‑offset

    return {
      left,
      width,
      height: CELL_HEIGHT,
    };
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Timeline View - {format(month, "MMMM yyyy")}
        </h3>
        <p className="text-sm text-gray-600">
          Click on any date to block it or create a manual booking
        </p>
      </div>

      {/* Header: day numbers */}
      <div className="relative" style={{ height: CELL_HEIGHT + 40 }}>
        <div className="flex" style={{ height: 40 }}>
          {days.map((day) => (
            <div
              key={format(day, "yyyy-MM-dd")}
              style={{ width: CELL_WIDTH }}
              className="flex items-center justify-center text-sm font-medium border-r border-gray-200 last:border-none"
            >
              {format(day, "d")}
            </div>
          ))}
        </div>

        {/* Timeline row: one row example */}
        <div className="absolute top-10 left-0 h-full w-full border-t border-gray-200">
          <div className="flex h-full">
            {days.map((day) => (
              <div
                key={"cell-" + format(day, "yyyy-MM-dd")}
                style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                className="border-r border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCellClick(day)}
              />
            ))}
          </div>

          {/* Render bookings */}
          {bookings.map((b) => {
            const { left, width } = getBookingStyle(b);
            const isBlocked = b.type === "blocked" || b.guestName === "Blocked Date";
            return (
              <div
                key={b.id}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full text-xs px-3 truncate shadow-sm ${
                  isBlocked ? "bg-rose-200 text-rose-900" : "bg-blue-400 text-white"
                }`}
                style={{ left, width, height: CELL_HEIGHT - 4 }}
              >
                {b.guestName}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialog for new booking / block */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, "PPP") : "Select"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <RadioGroup
              value={formState.mode}
              onValueChange={(val) => setFormState((s) => ({ ...s, mode: val }))}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="blocked" id="mode-blocked" />
                <Label htmlFor="mode-blocked">Block</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="manual" id="mode-manual" />
                <Label htmlFor="mode-manual">Manual booking</Label>
              </div>
            </RadioGroup>

            {formState.mode === "manual" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="guestName">Guest name</Label>
                  <Input
                    id="guestName"
                    value={formState.guestName}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, guestName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="price">Total price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formState.price}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, price: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="paymentMethod">Payment method</Label>
                  <Input
                    id="paymentMethod"
                    placeholder="cash / card / link"
                    value={formState.paymentMethod}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, paymentMethod: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}