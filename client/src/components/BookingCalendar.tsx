import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, isSameDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";
import { Check, Slash, CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";

export interface Reservation {
  id?: string;
  start: Date;
  end: Date;
  source: "airbnb" | "booking" | "manual" | "block";
  guest?: string;
  price?: number;
  payment?: "cash" | "card" | "bank" | "other";
}

interface Props {
  reservations: Reservation[];
  onCreate: (draft: Reservation) => void;
}

const sourceColors: Record<Reservation["source"], string> = {
  airbnb: "bg-red-400 text-red-900",
  booking: "bg-blue-400 text-blue-900", 
  manual: "bg-green-400 text-green-900",
  block: "bg-gray-300 text-gray-700",
};

const sourceLabels: Record<Reservation["source"], string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  manual: "Direct",
  block: "Blocked",
};

export default function BookingCalendar({ reservations, onCreate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<"block" | "manual">("block");
  const [guest, setGuest] = useState("");
  const [price, setPrice] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [payment, setPayment] = useState<Reservation["payment"]>("cash");

  const reset = () => {
    setOpen(false);
    setStep(1);
    setSelectedDate(undefined);
    setEndDate(undefined);
    setGuest("");
    setPrice("");
    setMode("block");
  };

  const isDateBooked = (date: Date) => {
    return reservations.some(r => 
      isWithinInterval(date, { start: r.start, end: addDays(r.end, -1) })
    );
  };

  const getDateBookings = (date: Date) => {
    return reservations.filter(r => 
      isWithinInterval(date, { start: r.start, end: addDays(r.end, -1) })
    );
  };

  const handleDateClick = (date: Date | undefined) => {
    if (!date || isDateBooked(date)) return;
    setSelectedDate(date);
    setEndDate(addDays(date, 1));
    setOpen(true);
    setStep(1);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    
    const payload: Reservation = {
      start: selectedDate,
      end: endDate || addDays(selectedDate, 1),
      source: mode === "block" ? "block" : "manual",
      guest: mode === "manual" ? guest : undefined,
      price: mode === "manual" ? Number(price) || undefined : undefined,
      payment: mode === "manual" ? payment : undefined,
    };
    
    onCreate(payload);
    reset();
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendarDay = (date: Date) => {
    const bookings = getDateBookings(date);
    
    if (bookings.length === 0) {
      return null;
    }

    if (bookings.length === 1) {
      const booking = bookings[0];
      return (
        <div className={cn(
          "absolute inset-1 rounded-full flex items-center justify-center text-[10px] font-medium overflow-hidden",
          sourceColors[booking.source]
        )}>
          {booking.guest ? booking.guest.slice(0, 3) : sourceLabels[booking.source].slice(0, 3)}
        </div>
      );
    }

    // Handle multiple bookings on same day
    return (
      <div className="absolute inset-1 flex">
        {bookings.slice(0, 2).map((booking, index) => (
          <div
            key={index}
            className={cn(
              "flex-1 flex items-center justify-center text-[8px] font-medium overflow-hidden",
              index === 0 ? "rounded-l-full" : "rounded-r-full",
              sourceColors[booking.source]
            )}
          >
            {sourceLabels[booking.source].slice(0, 2)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(sourceLabels).map(([source, label]) => (
              <div key={source} className="flex items-center gap-2">
                <div className={cn("w-4 h-4 rounded-full", sourceColors[source as Reservation["source"]])} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateClick}
              month={currentMonth}
              disabled={isDateBooked}
              className="w-full"
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span>{format(date, "d")}</span>
                    {renderCalendarDay(date)}
                  </div>
                ),
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {step === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedDate ? format(selectedDate, "PPPP") : "Select Action"}
                </DialogTitle>
                <DialogDescription>
                  Choose what to do with this date
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setMode("block");
                    handleSave();
                  }}
                  className="justify-start gap-2"
                >
                  <Slash className="w-4 h-4" />
                  Block Date
                </Button>
                <Button
                  onClick={() => {
                    setMode("manual");
                    setStep(2);
                  }}
                  className="justify-start gap-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Manual Booking
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Manual Booking</DialogTitle>
                <DialogDescription>
                  Enter booking details
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="checkout">Check-out Date</Label>
                  <Input
                    id="checkout"
                    type="date"
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    min={selectedDate ? format(addDays(selectedDate, 1), "yyyy-MM-dd") : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="guest">Guest Name</Label>
                  <Input
                    id="guest"
                    value={guest}
                    onChange={(e) => setGuest(e.target.value)}
                    placeholder="Enter guest name"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={payment} onValueChange={(value: any) => setPayment(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={reset}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!guest || !endDate}>
                  <Check className="w-4 h-4 mr-1" />
                  Save Booking
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}