#!/bin/bash

# Session cookie - you may need to update this if your session expires
SESSION_COOKIE="connect.sid=s%3A4G2FMAi4IfSjLoIGZp6LoaeL-XDiPlcr.k5T7sQYBLKL5NHdUCQVRoD1EYb9yT2v7YBk%2FKTwqnTA"

echo "🚀 Creating August 2025 bookings..."

# Booking 1: Marco Rossi (Aug 1-4)
echo "Creating booking for Marco Rossi..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "Marco",
    "guestLastName": "Rossi",
    "guestEmail": "marco.rossi@email.it",
    "guestCountry": "Italy",
    "guestPhone": "+39 333 1234567",
    "checkInDate": "2025-08-01",
    "checkOutDate": "2025-08-04",
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "guests": 2,
    "paymentMethod": "online",
    "bookingSource": "airbnb",
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

sleep 1

# Booking 2: Sophie Laurent (Aug 5-8)
echo "Creating booking for Sophie Laurent..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "Sophie",
    "guestLastName": "Laurent",
    "guestEmail": "sophie.laurent@email.fr",
    "guestCountry": "France",
    "guestPhone": "+33 6 12 34 56 78",
    "checkInDate": "2025-08-05",
    "checkOutDate": "2025-08-08",
    "checkInTime": "14:00",
    "checkOutTime": "10:00",
    "guests": 1,
    "paymentMethod": "online",
    "bookingSource": "booking.com",
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

sleep 1

# Booking 3: Hans Mueller (Aug 9-13)
echo "Creating booking for Hans Mueller..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "Hans",
    "guestLastName": "Mueller",
    "guestEmail": "hans.mueller@email.de",
    "guestCountry": "Germany",
    "guestPhone": "+49 151 12345678",
    "checkInDate": "2025-08-09",
    "checkOutDate": "2025-08-13",
    "checkInTime": "16:00",
    "checkOutTime": "11:00",
    "guests": 3,
    "paymentMethod": "property",
    "bookingSource": "direct",
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

sleep 1

# Booking 4: Emma Johnson (Aug 14-17)
echo "Creating booking for Emma Johnson..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "Emma",
    "guestLastName": "Johnson",
    "guestEmail": "emma.johnson@email.com",
    "guestCountry": "United States",
    "guestPhone": "+1 555 123 4567",
    "checkInDate": "2025-08-14",
    "checkOutDate": "2025-08-17",
    "checkInTime": "15:00",
    "checkOutTime": "10:00",
    "guests": 2,
    "paymentMethod": "online",
    "bookingSource": "airbnb",
    "hasPet": true,
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

sleep 1

# Booking 5: Carlos Garcia (Aug 18-22)
echo "Creating booking for Carlos Garcia..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "Carlos",
    "guestLastName": "Garcia",
    "guestEmail": "carlos.garcia@email.es",
    "guestCountry": "Spain",
    "guestPhone": "+34 612 345 678",
    "checkInDate": "2025-08-18",
    "checkOutDate": "2025-08-22",
    "checkInTime": "17:00",
    "checkOutTime": "12:00",
    "guests": 2,
    "paymentMethod": "online",
    "bookingSource": "booking.com",
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

sleep 1

# Booking 6: Anna Kowalski (Aug 23-26)
echo "Creating booking for Anna Kowalski..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "Anna",
    "guestLastName": "Kowalski",
    "guestEmail": "anna.kowalski@email.pl",
    "guestCountry": "Poland",
    "guestPhone": "+48 512 345 678",
    "checkInDate": "2025-08-23",
    "checkOutDate": "2025-08-26",
    "checkInTime": "14:00",
    "checkOutTime": "11:00",
    "guests": 4,
    "paymentMethod": "property",
    "bookingSource": "direct",
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

sleep 1

# Booking 7: David Wilson (Aug 27-31)
echo "Creating booking for David Wilson..."
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: $SESSION_COOKIE" \
  -d '{
    "guestFirstName": "David",
    "guestLastName": "Wilson",
    "guestEmail": "david.wilson@email.co.uk",
    "guestCountry": "United Kingdom",
    "guestPhone": "+44 7700 123456",
    "checkInDate": "2025-08-27",
    "checkOutDate": "2025-08-31",
    "checkInTime": "15:00",
    "checkOutTime": "10:00",
    "guests": 2,
    "paymentMethod": "online",
    "bookingSource": "airbnb",
    "createdBy": "admin"
  }' -s > /dev/null && echo "✅ Done" || echo "❌ Failed"

echo ""
echo "🎉 All bookings created!"
echo ""
echo "Now adding them to ICAL feed..."

# Add all bookings to ICAL feed
curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "Marco Rossi", "startDate": "2025-08-01", "endDate": "2025-08-04", "summary": "Booking - Marco Rossi", "description": "2 guests from Italy via Airbnb"}' -s > /dev/null

curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "Sophie Laurent", "startDate": "2025-08-05", "endDate": "2025-08-08", "summary": "Booking - Sophie Laurent", "description": "1 guest from France via Booking.com"}' -s > /dev/null

curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "Hans Mueller", "startDate": "2025-08-09", "endDate": "2025-08-13", "summary": "Booking - Hans Mueller", "description": "3 guests from Germany via Direct"}' -s > /dev/null

curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "Emma Johnson", "startDate": "2025-08-14", "endDate": "2025-08-17", "summary": "Booking - Emma Johnson", "description": "2 guests from USA via Airbnb (with pet)"}' -s > /dev/null

curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "Carlos Garcia", "startDate": "2025-08-18", "endDate": "2025-08-22", "summary": "Booking - Carlos Garcia", "description": "2 guests from Spain via Booking.com"}' -s > /dev/null

curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "Anna Kowalski", "startDate": "2025-08-23", "endDate": "2025-08-26", "summary": "Booking - Anna Kowalski", "description": "4 guests from Poland via Direct"}' -s > /dev/null

curl -X POST http://localhost:4000/bookings \
  -H "Content-Type: application/json" \
  -d '{"guestName": "David Wilson", "startDate": "2025-08-27", "endDate": "2025-08-31", "summary": "Booking - David Wilson", "description": "2 guests from UK via Airbnb"}' -s > /dev/null

echo "✅ Added to ICAL feed"
echo ""
echo "📊 Summary:"
echo "- Created 7 bookings for August 2025"
echo "- Dates covered: Aug 1-4, 5-8, 9-13, 14-17, 18-22, 23-26, 27-31"
echo "- Total of 16 guests from 7 different countries"
echo ""
echo "🎯 Next steps:"
echo "1. Check the Calendar tab to see all August dates blocked"
echo "2. Check the Bookings tab to see all 7 bookings"
echo "3. Check the Users tab to see new guest entries"
echo "4. Sync your PMS integration to see these in the PMS tab"
