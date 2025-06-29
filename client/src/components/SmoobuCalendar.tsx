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
    <div className="w-full mx-auto p-2 sm:p-4 lg:p-8 bg-gradient-to-br from-white to-gray-50 shadow-lg sm:shadow-2xl rounded-lg sm:rounded-2xl border border-gray-200">
      {/* Mobile-optimized Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-8 p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 space-y-3 sm:space-y-0">
        
        {/* Mobile: Month/Year and Navigation in one row */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 sm:h-9 sm:w-auto p-1 sm:p-2 rounded-full sm:rounded-md bg-blue-50 hover:bg-blue-100 border-blue-200 transition-all duration-200"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          
          <div className="text-center flex-1 sm:flex-none">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800">
              {format(currentMonth, "MMM yyyy")}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {bookings.length} bookings • {bookings.filter((b) => b.bookingSource === "blocked").length} blocked
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 sm:h-9 sm:w-auto p-1 sm:p-2 rounded-full sm:rounded-md bg-blue-50 hover:bg-blue-100 border-blue-200 transition-all duration-200"
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Mobile: Today button and status on second row */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 transition-all duration-200"
          >
            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Today
          </Button>

          {/* Compact status indicator for mobile */}
          <div className="flex items-center gap-1 sm:gap-2 text-xs text-green-600 bg-green-50 px-2 sm:px-3 py-1 sm:py-2 rounded-full sm:rounded-lg border border-green-200">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Mobile-optimized days of week header */}
      <div className="grid grid-cols-7 gap-0 mb-1 sm:mb-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
          const fullDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return (
            <div
              key={day + index}
              className="p-1 sm:p-2 text-center font-semibold text-gray-700 text-xs sm:text-sm border-r border-gray-200 last:border-r-0"
            >
              <span className="sm:hidden">{day}</span>
              <span className="hidden sm:inline">{fullDays[index]}</span>
            </div>
          );
        })}
      </div>

      {/* Professional Mobile Calendar Grid */}
      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0">
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
                  relative h-20 sm:h-24 lg:h-28 border-r border-b border-gray-100 text-xs last:border-r-0
                  transition-all duration-200 active:scale-95 touch-manipulation
                  ${
                    hasBlockedBooking
                      ? "blocked-stripe cursor-not-allowed"
                      : isPastDate
                        ? "bg-gray-50 cursor-not-allowed opacity-60"
                        : checkInBooking
                          ? "bg-red-50 cursor-not-allowed"
                          : hasCheckOutOnly
                            ? "bg-yellow-50 cursor-pointer active:bg-yellow-100"
                            : "bg-white cursor-pointer active:bg-blue-50"
                  }
                  ${isCurrentDay ? "ring-2 ring-blue-500 ring-inset bg-blue-50" : ""}
                  ${!isCurrentMonthDay ? "opacity-40" : ""}
                `}
                onClick={() => (isClickable ? handleDateClick(day) : null)}
              >
                {/* Clean Date Number */}
                <div className="absolute top-2 left-2 z-20">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isCurrentDay
                        ? "bg-blue-500 text-white shadow-md"
                        : isPastDate
                          ? "text-gray-400"
                          : checkInBooking
                            ? "bg-red-500 text-white"
                            : hasCheckOutOnly
                              ? "bg-yellow-500 text-white"
                              : hasBlockedBooking
                                ? "bg-gray-500 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                {/* Simple Status Indicators */}
                {hasCheckOutOnly && !checkInBooking && (
                  <div className="absolute bottom-1 right-1 text-xs font-bold text-yellow-700 bg-yellow-200 px-1 py-0.5 rounded-sm">
                    OUT
                  </div>
                )}

                {checkInBooking && (
                  <div className="absolute bottom-1 right-1 text-xs font-bold text-red-700 bg-red-200 px-1 py-0.5 rounded-sm">
                    IN
                  </div>
                )}
              </div>
            );
          })}
        </div>

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

          // Responsive row height calculation matching CSS classes
          const cellHeight = window.innerWidth < 640 ? 80 : window.innerWidth < 1024 ? 96 : 112; // h-20 sm:h-24 lg:h-28
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
                  top: `${startRow * cellHeight + cellHeight / 2 + verticalOffset}px`,
                  left: leftPos,
                  width: widthPercent,
                  height: window.innerWidth < 640 ? "16px" : "20px",
                  transform: "translateY(-50%)",
                }}
              >
                <div
                  className={`w-full h-full flex items-center justify-center text-xs sm:text-sm font-bold px-1 sm:px-2 shadow-md border border-white
                  transition-all duration-200 active:scale-95 touch-manipulation
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
                  top: `${row * cellHeight + cellHeight / 2 + verticalOffset}px`,
                  left: leftPos,
                  width: widthPercent,
                  height: window.innerWidth < 640 ? "16px" : "20px",
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

      {/* Mobile-optimized Booking Form Modal */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              Create Booking
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedDate && format(selectedDate, "MMMM d, yyyy")}
            </p>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="mode" className="text-sm sm:text-base font-medium">Booking Type</Label>
              <Select
                value={formData.mode}
                onValueChange={(value: "blocked" | "manual") =>
                  setFormData({ ...formData, mode: value })
                }
              >
                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
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
                  <Label htmlFor="blockReason" className="text-sm sm:text-base font-medium">Blocking Reason</Label>
                  <Input
                    id="blockReason"
                    value={formData.blockReason || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, blockReason: e.target.value })
                    }
                    placeholder="Maintenance, personal use, etc."
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="nights" className="text-sm sm:text-base font-medium">Number of Nights</Label>
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
                    className="h-12 sm:h-10 text-base sm:text-sm"
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

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-200"
              >
                {createBookingMutation.isPending
                  ? "Creating..."
                  : "Create Booking"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBookingForm(false)}
                className="h-12 sm:h-10 text-base sm:text-sm border-2 active:scale-95 transition-all duration-200"
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
