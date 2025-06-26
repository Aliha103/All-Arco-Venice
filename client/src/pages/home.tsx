import Header from "@/components/header";
import ImageGallery from "@/components/image-gallery";
import AmenitiesSection from "@/components/amenities-section";
import CalendarBooking from "@/components/calendar-booking";
import AboutSection from "@/components/about-section";
import ReviewsSection from "@/components/reviews-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <ImageGallery />
        <AmenitiesSection />
        <CalendarBooking />
        <AboutSection />
        <ReviewsSection />
      </main>
      <Footer />
    </div>
  );
}
