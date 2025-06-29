import React, { useState, useEffect } from "react";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  isToday,
  isWithinInterval,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestCountry: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentMethod: "online" | "property";
  hasPet?: boolean;
  referralCode?: string;
  createdBy?: "admin" | "guest";
  bookedForSelf?: boolean;
  userId?: string;
  blockReason?: string;
  bookingSource?: string;
  confirmationCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface SmoobuBooking extends Booking {
  guestName: string;
  checkIn: Date;
  checkOut: Date;
}

interface CalendarProps {
  bookings?: Booking[];
  month?: Date;
}

const SmoobuCalendar: React.FC<CalendarProps> = ({ month: initialMonth }) => {
  const [currentMonth, setCurrentMonth] = useState(initialMonth || new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    mode: "manual" as "blocked" | "manual",
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guests: 2,
    nights: 1,
    manualPrice: 0,
    blockReason: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings for calendar display (includes blocks) with 100ms refresh
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: [
      "/api/bookings/calendar",
      format(currentMonth, "yyyy"),
      format(currentMonth, "MM"),
    ],
    queryFn: () =>
      fetch(
        `/api/bookings/calendar/${format(currentMonth, "yyyy")}/${format(currentMonth, "MM")}`,
      ).then((res) => res.json()),
    refetchInterval: 100, // 100ms real-time refresh
    refetchIntervalInBackground: true,
  });

  // Real-time calendar updates effect
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: [
          "/api/bookings/calendar",
          format(currentMonth, "yyyy"),
          format(currentMonth, "MM"),
        ],
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentMonth, queryClient]);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      if (!response.ok) {
        throw new Error("Failed to create booking");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setShowBookingForm(false);
      setSelectedDate(null);
      setFormData({
        mode: "manual",
        guestFirstName: "",
        guestLastName: "",
        guestEmail: "",
        guests: 2,
        nights: 1,
        manualPrice: 0,
        blockReason: "",
      });
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  // Convert bookings to SmoobuBooking format
  const smoobuBookings: SmoobuBooking[] = bookings.map((booking) => ({
    ...booking,
    guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
    checkIn: parseISO(booking.checkInDate),
    checkOut: parseISO(booking.checkOutDate),
  }));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getBookingsForDay = (day: Date) => {
    return smoobuBookings.filter((booking) =>
      isWithinInterval(day, { start: booking.checkIn, end: booking.checkOut }),
    );
  };

  const bookingForCheckIn = (day: Date) => {
    return smoobuBookings.find((booking) => {
      const checkInDate = new Date(booking.checkInDate);
      return isSameDay(checkInDate, day);
    });
  };

  const bookingForCheckOut = (day: Date) => {
    return smoobuBookings.find((booking) => {
      const checkOutDate = new Date(booking.checkOutDate);
      return isSameDay(checkOutDate, day);
    });
  };

  // Group consecutive booking days together for continuous rendering
  const getBookingSpans = () => {
    const spans: any[] = [];

    smoobuBookings.forEach((booking) => {
      const checkInDate = new Date(booking.checkInDate);
      const checkOutDate = new Date(booking.checkOutDate);

      // For booking spans, we include check-in and check-out days to show the visual span
      // But exclude the check-out day from occupied days (handled elsewhere)
      const bookingDays = eachDayOfInterval({
        start: checkInDate,
        end: checkOutDate,
      });

      // Only include days that are in the current month view
      const monthDays = bookingDays.filter((day) =>
        daysInMonth.some((monthDay) => isSameDay(day, monthDay)),
      );

      if (monthDays.length > 0) {
        spans.push({
          booking,
          days: monthDays,
          startDay: checkInDate, // Always use actual check-in date
          endDay: checkOutDate, // Always use actual check-out date
          isCheckIn: true, // This booking has a check-in
          isCheckOut: true, // This booking has a check-out
        });
      }
    });

    return spans;
  };

  const bookingSpans = getBookingSpans();

  const sourceColors = {
    airbnb: "bg-red-500 text-white",
    "booking.com": "bg-blue-500 text-white",
    direct: "bg-green-500 text-white",
    blocked: "blocked-stripe text-gray-800",
    manual: "bg-[#a855f7] text-white",
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleDateClick = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) return;

    // Rule 1: Admin cannot select previous days, only current day and future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) {
      toast({
        title: "Date Unavailable",
        description:
          "Cannot select previous dates. Only current and future dates are available.",
        variant: "destructive",
      });
      return;
    }

    // Rule 2: Check if admin can book on this date
    const checkInBooking = bookingForCheckIn(date);
    const checkOutBooking = bookingForCheckOut(date);

    // If there's a check-in booking, date is fully occupied
    if (checkInBooking) {
      toast({
        title: "Date Unavailable",
        description: "This date already has a check-in booking",
        variant: "destructive",
      });
      return;
    }

    // If there's only a check-out booking, admin can still book check-in (Rule 2)
    // This is allowed, so we proceed

    setSelectedDate(date);
    setShowBookingForm(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedDate) return;

    console.log("🔵 CLIENT: Creating booking with mode:", formData.mode);
    console.log("🔵 CLIENT: Form data:", formData);

    const checkOutDate = new Date(selectedDate);
    checkOutDate.setDate(checkOutDate.getDate() + formData.nights);

    if (formData.mode === "blocked") {
      // Block dates - administrative blocks (NOT bookings)
      const blockData = {
        checkInDate: format(selectedDate, "yyyy-MM-dd"),
        checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
        blockReason: formData.blockReason || "Administrative block",
      };

      console.log("🔵 CLIENT: Creating block dates with data:", blockData);

      // Use separate block dates endpoint
      try {
        const response = await fetch("/api/block-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(blockData),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("🔴 CLIENT: Block dates API error:", error);
          throw new Error(error.message || "Failed to block dates");
        }

        toast({ title: "Success", description: "Dates blocked successfully" });
        setShowBookingForm(false);
        setFormData({
          mode: "manual",
          guestFirstName: "",
          guestLastName: "",
          guestEmail: "",
          guests: 1,
          nights: 1,
          manualPrice: 0,
          blockReason: "",
        });
        queryClient.invalidateQueries({
          queryKey: [
            "/api/bookings/calendar",
            format(currentMonth, "yyyy"),
            format(currentMonth, "MM"),
          ],
        });
      } catch (error) {
        console.error("🔴 CLIENT: Block dates error:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to block dates",
          variant: "destructive",
        });
      }
    } else {
      // Manual booking with complete guest details and pricing
      const cityTax = Math.min(formData.nights, 5) * formData.guests * 4; // €4 per person per night, max 5 nights
      const totalPrice = formData.manualPrice + cityTax;

      const bookingData = {
        guestFirstName: formData.guestFirstName,
        guestLastName: formData.guestLastName,
        guestEmail: formData.guestEmail,
        guestCountry: "Manual Entry",
        guestPhone: "000-000-0000",
        checkInDate: format(selectedDate, "yyyy-MM-dd"),
        checkOutDate: format(checkOutDate, "yyyy-MM-dd"),
        guests: formData.guests,
        paymentMethod: "property",
        hasPet: false,
        createdBy: "admin",
        bookedForSelf: false,
        bookingSource: "direct",
        totalPrice: totalPrice,
      };

      console.log("🔵 CLIENT: Creating manual booking with data:", bookingData);
      createBookingMutation.mutate(bookingData);
    }
  };

  const resetForm = () => {
    setFormData({
      mode: "manual",
      guestFirstName: "",
      guestLastName: "",
      guestEmail: "",
      guests: 1,
      nights: 1,
      manualPrice: 0,
      blockReason: "",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto my-6 p-6 bg-white shadow-lg rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-6 p-8 bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl border border-gray-200">
      {/* Advanced Header with enhanced navigation and status */}
      <div className="flex items-center justify-between mb-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-sm text-gray-500">
              {bookings.length} bookings •{" "}
              {bookings.filter((b) => b.bookingSource === "blocked").length}{" "}
              blocked dates
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-105"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 transition-all duration-200 hover:scale-105"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Today
          </Button>

          {/* Real-time status indicator */}
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="font-medium">Live 100ms</span>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-center font-medium text-gray-600 text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Advanced Calendar grid with enhanced visual design */}
      <div className="grid grid-cols-7 gap-0 border-t-2 border-l-2 border-gray-300 relative shadow-inner rounded-lg overflow-hidden bg-white">
        {daysInMonth.map((day, dayIndex) => {
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isSameMonth(day, currentMonth);

          // Check date availability based on new rules
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dayDate = new Date(day);
          dayDate.setHours(0, 0, 0, 0);

          const isPastDate = dayDate < today;
          const checkInBooking = bookingForCheckIn(day);
          const checkOutBooking = bookingForCheckOut(day);

          // Check if this day has a blocked booking
          const dayBookings = getBookingsForDay(day);
          const hasBlockedBooking = dayBookings.some(
            (booking) => booking.bookingSource === "blocked",
          );

          // Date is clickable if: not past date AND no check-in booking
          const isClickable = !isPastDate && !checkInBooking;
          const hasCheckOutOnly = checkOutBooking && !checkInBooking;

          return (
            <div
              key={day.toISOString()}
              className={`
                relative h-28 border-r-2 border-b-2 border-gray-200 text-xs
                ${
                  hasBlockedBooking
                    ? "blocked-stripe cursor-not-allowed"
                    : isPastDate
                      ? "bg-gradient-to-br from-gray-100 to-gray-200 cursor-not-allowed opacity-60"
                      : checkInBooking
                        ? "bg-gradient-to-br from-red-50 to-red-100 cursor-not-allowed shadow-inner"
                        : hasCheckOutOnly
                          ? "bg-gradient-to-br from-yellow-50 to-yellow-100 cursor-pointer"
                          : "bg-gradient-to-br from-white to-gray-50 cursor-pointer"
                }
                ${isCurrentDay ? "ring-3 ring-blue-500 ring-inset shadow-md bg-gradient-to-br from-blue-50 to-blue-100" : ""}
                ${!isCurrentMonthDay ? "opacity-40" : ""}
              `}
              onClick={() => (isClickable ? handleDateClick(day) : null)}
            >
              {/* Enhanced date number with gradient background */}
              <div
                className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-20 ${
                  isCurrentDay
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg ring-2 ring-blue-300 ring-offset-1"
                    : isPastDate
                      ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-600"
                      : checkInBooking
                        ? "bg-gradient-to-br from-red-400 to-red-500 text-white shadow-md"
                        : hasCheckOutOnly
                          ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-md"
                          : hasBlockedBooking
                            ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-md"
                            : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700"
                }`}
              >
                {format(day, "d")}
              </div>

              {/* Enhanced visual indicators with animations */}
              {isPastDate && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                  ×
                </div>
              )}

              {/* Add a subtle plus icon for clickable dates */}
              {isClickable && !hasBlockedBooking && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white opacity-60">
                  <Plus className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}

        {/* Render continuous booking spans on top */}
        {bookingSpans.map((span, spanIndex) => {
          const startIndex = daysInMonth.findIndex((day) =>
            isSameDay(day, span.startDay),
          );
          const endIndex = daysInMonth.findIndex((day) =>
            isSameDay(day, span.endDay),
          );

          if (startIndex === -1 || endIndex === -1) return null;

          const startRow = Math.floor(startIndex / 7);
          const endRow = Math.floor(endIndex / 7);
          const startCol = startIndex % 7;
          const endCol = endIndex % 7;

          // No vertical offset - all spans align horizontally
          const verticalOffset = 0; // All bookings at same level

          // Single row span
          if (startRow === endRow) {
            // Cell layout: 45% check-out | 10% free space | 45% check-in
            const cellWidth = 100 / 7; // Each cell is 1/7 of total width

            let leftPos, widthPercent;

            // All bookings: span from check-in area (55% of start cell) to check-out area (45% of end cell)
            const startAtCheckIn = startCol * cellWidth + cellWidth * 0.55; // Start of check-in area (55% into start cell)
            const endAtCheckOut = endCol * cellWidth + cellWidth * 0.45; // End of check-out area (45% into end cell)

            leftPos = `${startAtCheckIn}%`;
            widthPercent = `${endAtCheckOut - startAtCheckIn}%`;

            return (
              <div
                key={`span-${span.booking.id}`}
                className="absolute z-10"
                style={{
                  top: `${startRow * 96 + 48 + verticalOffset}px`,
                  left: leftPos,
                  width: widthPercent,
                  height: "24px",
                  transform: "translateY(-50%)",
                }}
              >
                <div
                  className={`w-full h-full flex items-center justify-center text-xs font-bold px-2 shadow-lg border-2 border-white
                  transition-all duration-300 hover:scale-105 hover:shadow-xl hover:z-30 mt-[40px] mb-[40px] pt-[15px] pb-[15px]
                  ${
                    span.isCheckIn && span.isCheckOut
                      ? "rounded-full"
                      : span.isCheckIn
                        ? "rounded-l-full"
                        : span.isCheckOut
                          ? "rounded-r-full"
                          : ""
                  }
                  ${sourceColors[span.booking.bookingSource as keyof typeof sourceColors] || sourceColors.manual}`}
                >
                  <span className="truncate">
                    {span.booking.guestFirstName} {span.booking.guestLastName}
                  </span>
                </div>
              </div>
            );
          }

          // Multi-row spans
          const rows = [];
          const cellWidth = 100 / 7;

          for (let row = startRow; row <= endRow; row++) {
            const isFirstRow = row === startRow;
            const isLastRow = row === endRow;
            const rowStartCol = isFirstRow ? startCol : 0;
            const rowEndCol = isLastRow ? endCol : 6;

            let leftPos, widthPercent;

            if (isFirstRow && span.isCheckIn) {
              // First row: start from check-in area (55% into cell), go to end of row
              leftPos = `${rowStartCol * cellWidth + cellWidth * 0.55}%`;
              widthPercent = `${(rowEndCol - rowStartCol + 1) * cellWidth - cellWidth * 0.55}%`;
            } else if (isLastRow && span.isCheckOut) {
              // Last row: start from beginning, end at check-out area (45% into cell)
              leftPos = `${rowStartCol * cellWidth}%`;
              widthPercent = `${(rowEndCol - rowStartCol) * cellWidth + cellWidth * 0.45}%`;
            } else {
              // Middle rows: full width
              leftPos = `${rowStartCol * cellWidth}%`;
              widthPercent = `${(rowEndCol - rowStartCol + 1) * cellWidth}%`;
            }

            rows.push(
              <div
                key={`span-${span.booking.id}-row-${row}`}
                className="absolute z-10"
                style={{
                  top: `${row * 96 + 48 + verticalOffset}px`,
                  left: leftPos,
                  width: widthPercent,
                  height: "24px",
                  transform: "translateY(-50%)",
                }}
              >
                <div
                  className={`w-full h-full flex items-center justify-center text-xs font-medium px-2 ${
                    isFirstRow && span.isCheckIn
                      ? "rounded-l-full"
                      : isLastRow && span.isCheckOut
                        ? "rounded-r-full"
                        : ""
                  } ${sourceColors[span.booking.bookingSource as keyof typeof sourceColors] || sourceColors.manual}`}
                >
                  <span className="truncate">
                    {span.booking.guestFirstName} {span.booking.guestLastName}
                  </span>
                </div>
              </div>,
            );
          }

          return rows;
        })}
      </div>

      {/* Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create Booking for{" "}
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mode">Booking Type</Label>
              <Select
                value={formData.mode}
                onValueChange={(value: "blocked" | "manual") =>
                  setFormData({ ...formData, mode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Booking</SelectItem>
                  <SelectItem value="blocked">Block Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.mode === "blocked" && (
              <>
                <div>
                  <Label htmlFor="blockReason">Blocking Reason</Label>
                  <Input
                    id="blockReason"
                    value={formData.blockReason || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, blockReason: e.target.value })
                    }
                    placeholder="Maintenance, personal use, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="nights">Number of Nights</Label>
                  <Input
                    id="nights"
                    type="number"
                    min="1"
                    max="15"
                    value={formData.nights}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nights: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </>
            )}

            {formData.mode === "manual" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guestFirstName">First Name</Label>
                    <Input
                      id="guestFirstName"
                      value={formData.guestFirstName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestFirstName: e.target.value,
                        })
                      }
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestLastName">Last Name</Label>
                    <Input
                      id="guestLastName"
                      value={formData.guestLastName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestLastName: e.target.value,
                        })
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={formData.guestEmail || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, guestEmail: e.target.value })
                    }
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guests">Number of Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.guests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guests: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="nights">Number of Nights</Label>
                    <Input
                      id="nights"
                      type="number"
                      min="1"
                      max="15"
                      value={formData.nights}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nights: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="manualPrice">Manual Price (€)</Label>
                  <Input
                    id="manualPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.manualPrice || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        manualPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Enter total price"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>City Tax:</strong> €4 per person per night
                    <br />
                    <strong>Total City Tax:</strong> €
                    {Math.min(formData.nights, 5) * formData.guests * 4}
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleCreateBooking}
                disabled={
                  createBookingMutation.isPending ||
                  (formData.mode === "manual" &&
                    (!formData.guestFirstName ||
                      !formData.guestLastName ||
                      !formData.guestEmail)) ||
                  (formData.mode === "blocked" && !formData.blockReason)
                }
                className="flex-1"
              >
                {createBookingMutation.isPending
                  ? "Creating..."
                  : "Create Booking"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBookingForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmoobuCalendar;
