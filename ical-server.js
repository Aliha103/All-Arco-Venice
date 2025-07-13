import express from 'express';
import ical from 'ical-generator';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Example bookings array (replace with your actual database logic)
let bookings = [
  {
    id: 1,
    guestName: 'John Doe',
    startDate: new Date('2025-07-15'),
    endDate: new Date('2025-07-20'),
    summary: 'Apartment Booking - John Doe',
    description: 'Booking confirmed via direct website.',
  },
  {
    id: 2,
    guestName: 'Jane Smith',
    startDate: new Date('2025-07-25'),
    endDate: new Date('2025-07-29'),
    summary: 'Apartment Booking - Jane Smith',
    description: 'Booking via Airbnb integration.',
  },
];

// Serve ICAL feed
app.get('/calendar.ics', (req, res) => {
  const calendar = ical({
    domain: 'yourapartment.com',
    name: 'Apartment Bookings',
    timezone: 'Europe/Rome',
  });

  bookings.forEach((booking) => {
    calendar.createEvent({
      start: booking.startDate,
      end: booking.endDate,
      summary: booking.summary,
      description: booking.description,
      uid: `booking-${booking.id}@yourapartment.com`,
      timestamp: new Date(),
    });
  });

  res.set({
    'Content-Type': 'text/calendar; charset=utf-8',
    'Content-Disposition': 'attachment; filename="calendar.ics"'
  });
  res.send(calendar.toString());
});

// Endpoint to add bookings (e.g., from your test platform)
app.post('/bookings', (req, res) => {
  const { guestName, startDate, endDate, summary, description } = req.body;

  const newBooking = {
    id: bookings.length + 1,
    guestName,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    summary: summary || `Apartment Booking - ${guestName}`,
    description: description || `Booking created via API`,
  };

  bookings.push(newBooking);

  res.status(201).json(newBooking);
});

// Get all bookings (for testing)
app.get('/bookings', (req, res) => {
  res.json(bookings);
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {



});
