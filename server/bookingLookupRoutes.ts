import { Router } from "express";
import { storage } from "./storage";
import { findReservationSchema } from "../shared/schema";
import { z } from "zod";
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const router = Router();

// Find reservation by confirmation code and email
router.post("/find", async (req, res) => {
  try {
    const validatedData = findReservationSchema.parse(req.body);
    
    // Find booking by confirmation code
    const booking = await storage.getBookingByConfirmationCode(validatedData.confirmationCode);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Reservation not found. Please check your confirmation code and try again."
      });
    }

    // Verify email matches
    if (booking.guestEmail.toLowerCase() !== validatedData.email.toLowerCase()) {
      return res.status(404).json({ 
        success: false,
        message: "Email address doesn't match our records. Please check and try again."
      });
    }

    // Return booking details (excluding sensitive information)
    const bookingDetails = {
      confirmationCode: booking.confirmationCode,
      guestFirstName: booking.guestFirstName,
      guestLastName: booking.guestLastName,
      guestEmail: booking.guestEmail,
      guestCountry: booking.guestCountry,
      guestPhone: booking.guestPhone,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      checkInTime: booking.checkInTime,
      checkOutTime: booking.checkOutTime,
      guests: booking.guests,
      totalNights: booking.totalNights,
      basePrice: booking.basePrice,
      totalPrice: booking.totalPrice,
      cleaningFee: booking.cleaningFee,
      serviceFee: booking.serviceFee,
      petFee: booking.petFee,
      cityTax: booking.cityTax,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      hasPet: booking.hasPet,
      createdAt: booking.createdAt,
      lengthOfStayDiscount: booking.lengthOfStayDiscount,
      lengthOfStayDiscountPercent: booking.lengthOfStayDiscountPercent,
      referralCredit: booking.referralCredit,
      promotionDiscount: booking.promotionDiscount,
      promoCodeDiscount: booking.promoCodeDiscount,
      voucherDiscount: booking.voucherDiscount,
      totalDiscountAmount: booking.totalDiscountAmount,
    };

    res.json({
      success: true,
      booking: bookingDetails,
      message: "Reservation found successfully"
    });
  } catch (error) {
    console.error("Error finding reservation:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }

    res.status(500).json({ 
      success: false,
      message: "An error occurred while searching for your reservation"
    });
  }
});

// Generate and download booking confirmation PDF
router.post("/download-confirmation", async (req, res) => {
  try {
    const validatedData = findReservationSchema.parse(req.body);
    
    // Find booking by confirmation code
    const booking = await storage.getBookingByConfirmationCode(validatedData.confirmationCode);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "Reservation not found"
      });
    }

    // Verify email matches
    if (booking.guestEmail.toLowerCase() !== validatedData.email.toLowerCase()) {
      return res.status(404).json({ 
        success: false,
        message: "Email address doesn't match our records"
      });
    }

    // Generate QR code for booking
    const qrCodeData = `https://allarco.com/booking/${booking.confirmationCode}`;
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, { 
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="booking-confirmation-${booking.confirmationCode}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('All\'Arco Venice', { align: 'center' })
       .fontSize(16)
       .font('Helvetica')
       .text('Luxury Apartment Booking Confirmation', { align: 'center' })
       .moveDown(2);

    // Confirmation details
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(`Confirmation Code: ${booking.confirmationCode}`, { align: 'center' })
       .moveDown(1);

    // Guest information
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Guest Information:')
       .font('Helvetica')
       .text(`Name: ${booking.guestFirstName} ${booking.guestLastName}`)
       .text(`Email: ${booking.guestEmail}`)
       .text(`Phone: ${booking.guestPhone}`)
       .text(`Country: ${booking.guestCountry}`)
       .moveDown(1);

    // Booking details
    doc.font('Helvetica-Bold')
       .text('Booking Details:')
       .font('Helvetica')
       .text(`Check-in: ${booking.checkInDate} at ${booking.checkInTime}`)
       .text(`Check-out: ${booking.checkOutDate} at ${booking.checkOutTime}`)
       .text(`Guests: ${booking.guests}`)
       .text(`Total Nights: ${booking.totalNights}`)
       .text(`Status: ${booking.status.toUpperCase()}`)
       .text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`)
       .moveDown(1);

    // Pricing breakdown
    doc.font('Helvetica-Bold')
       .text('Pricing Breakdown:')
       .font('Helvetica')
       .text(`Base Price (€${booking.basePrice} × ${booking.totalNights} nights): €${(parseFloat(booking.basePrice) * booking.totalNights).toFixed(2)}`)
       .text(`Cleaning Fee: €${booking.cleaningFee}`)
       .text(`Service Fee: €${booking.serviceFee}`);

    if (parseFloat(booking.petFee) > 0) {
      doc.text(`Pet Fee: €${booking.petFee}`);
    }

    if (parseFloat(booking.cityTax) > 0) {
      doc.text(`City Tax: €${booking.cityTax}`);
    }

    if (parseFloat(booking.lengthOfStayDiscount) > 0) {
      doc.text(`Length of Stay Discount (${booking.lengthOfStayDiscountPercent}%): -€${booking.lengthOfStayDiscount}`);
    }

    if (parseFloat(booking.referralCredit) > 0) {
      doc.text(`Referral Credit: -€${booking.referralCredit}`);
    }

    if (parseFloat(booking.promotionDiscount) > 0) {
      doc.text(`Promotion Discount: -€${booking.promotionDiscount}`);
    }

    if (parseFloat(booking.promoCodeDiscount) > 0) {
      doc.text(`Promo Code Discount: -€${booking.promoCodeDiscount}`);
    }

    if (parseFloat(booking.voucherDiscount) > 0) {
      doc.text(`Voucher Discount: -€${booking.voucherDiscount}`);
    }

    doc.moveDown(0.5)
       .font('Helvetica-Bold')
       .fontSize(16)
       .text(`Total Amount: €${booking.totalPrice}`)
       .moveDown(1);

    // Property information
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Property Information:')
       .font('Helvetica')
       .text('All\'Arco Apartment - Heart of Venice')
       .text('2 Bedrooms, 1 Bathroom')
       .text('Accommodates up to 5 guests')
       .text('Located in the prestigious All\'Arco district')
       .moveDown(1);

    // Important notes
    doc.font('Helvetica-Bold')
       .text('Important Notes:')
       .font('Helvetica')
       .text('• Please bring a valid ID for check-in')
       .text('• Check-in time is 3:00 PM, check-out is 10:00 AM')
       .text('• City tax may be collected at the property')
       .text('• Contact us if you need to modify your reservation')
       .moveDown(1);

    // QR Code
    if (qrCodeImage) {
      doc.font('Helvetica-Bold')
         .text('Quick Access:')
         .font('Helvetica')
         .text('Scan this QR code to access your booking:')
         .image(qrCodeImage, { 
           width: 100,
           align: 'left'
         });
    }

    // Footer
    doc.fontSize(12)
       .font('Helvetica')
       .text('Thank you for choosing All\'Arco Venice!', { align: 'center' })
       .text('For assistance, please contact us at info@allarco.com', { align: 'center' })
       .moveDown(0.5)
       .fontSize(10)
       .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid input data",
        errors: error.errors
      });
    }

    res.status(500).json({ 
      success: false,
      message: "An error occurred while generating the confirmation"
    });
  }
});

export { router as bookingLookupRoutes };