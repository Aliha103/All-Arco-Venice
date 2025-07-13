import axios from 'axios';

// Realistic guest data for August bookings
const augustBookings = [
  {
    guestFirstName: "Marco",
    guestLastName: "Rossi",
    guestEmail: "marco.rossi@email.it",
    guestCountry: "Italy",
    guestPhone: "+39 333 1234567",
    checkInDate: "2025-08-01",
    checkOutDate: "2025-08-04",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    guests: 2,
    paymentMethod: "online",
    bookingSource: "airbnb"
  },
  {
    guestFirstName: "Sophie",
    guestLastName: "Laurent",
    guestEmail: "sophie.laurent@email.fr",
    guestCountry: "France",
    guestPhone: "+33 6 12 34 56 78",
    checkInDate: "2025-08-05",
    checkOutDate: "2025-08-08",
    checkInTime: "14:00",
    checkOutTime: "10:00",
    guests: 1,
    paymentMethod: "online",
    bookingSource: "booking.com"
  },
  {
    guestFirstName: "Hans",
    guestLastName: "Mueller",
    guestEmail: "hans.mueller@email.de",
    guestCountry: "Germany",
    guestPhone: "+49 151 12345678",
    checkInDate: "2025-08-09",
    checkOutDate: "2025-08-13",
    checkInTime: "16:00",
    checkOutTime: "11:00",
    guests: 3,
    paymentMethod: "property",
    bookingSource: "direct"
  },
  {
    guestFirstName: "Emma",
    guestLastName: "Johnson",
    guestEmail: "emma.johnson@email.com",
    guestCountry: "United States",
    guestPhone: "+1 555 123 4567",
    checkInDate: "2025-08-14",
    checkOutDate: "2025-08-17",
    checkInTime: "15:00",
    checkOutTime: "10:00",
    guests: 2,
    paymentMethod: "online",
    bookingSource: "airbnb",
    hasPet: true
  },
  {
    guestFirstName: "Carlos",
    guestLastName: "Garcia",
    guestEmail: "carlos.garcia@email.es",
    guestCountry: "Spain",
    guestPhone: "+34 612 345 678",
    checkInDate: "2025-08-18",
    checkOutDate: "2025-08-22",
    checkInTime: "17:00",
    checkOutTime: "12:00",
    guests: 2,
    paymentMethod: "online",
    bookingSource: "booking.com"
  },
  {
    guestFirstName: "Anna",
    guestLastName: "Kowalski",
    guestEmail: "anna.kowalski@email.pl",
    guestCountry: "Poland",
    guestPhone: "+48 512 345 678",
    checkInDate: "2025-08-23",
    checkOutDate: "2025-08-26",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    guests: 4,
    paymentMethod: "property",
    bookingSource: "direct"
  },
  {
    guestFirstName: "David",
    guestLastName: "Wilson",
    guestEmail: "david.wilson@email.co.uk",
    guestCountry: "United Kingdom",
    guestPhone: "+44 7700 123456",
    checkInDate: "2025-08-27",
    checkOutDate: "2025-08-31",
    checkInTime: "15:00",
    checkOutTime: "10:00",
    guests: 2,
    paymentMethod: "online",
    bookingSource: "airbnb"
  }
];

async function createBooking(bookingData) {
  try {
    // First, try to create a user account for the guest
    const signupData = {
      firstName: bookingData.guestFirstName,
      lastName: bookingData.guestLastName,
      email: bookingData.guestEmail,
      password: "TestPassword123!", // Default password for test users
      confirmPassword: "TestPassword123!"
    };

    try {
      const signupResponse = await axios.post('http://localhost:3000/api/auth/signup', signupData);

    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {

      } else {

      }
    }

    // Create the booking
    const response = await axios.post('http://localhost:3000/api/bookings', bookingData, {
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need proper authentication
        // This is just for demonstration
      }
    });

    // Also add to ICAL server
    await axios.post('http://localhost:4000/bookings', {
      guestName: `${bookingData.guestFirstName} ${bookingData.guestLastName}`,
      startDate: bookingData.checkInDate,
      endDate: bookingData.checkOutDate,
      summary: `Booking - ${bookingData.guestFirstName} ${bookingData.guestLastName}`,
      description: `${bookingData.guests} guests from ${bookingData.guestCountry} via ${bookingData.bookingSource}`
    });

    return response.data;
  } catch (error) {

  }
}

async function createAllBookings() {

  for (const booking of augustBookings) {
    await createBooking(booking);
    // Add delay between bookings to simulate realistic creation
    await new Promise(resolve => setTimeout(resolve, 1000));

  }










}

// Run the script
createAllBookings().catch(console.error);
