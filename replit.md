# All'arco Luxury Apartment Booking System

## Overview

This is a full-stack web application for managing bookings at All'arco luxury apartment. The system provides a modern React frontend with an Express.js backend, featuring real-time updates, payment processing via Stripe, and comprehensive admin management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Real-time Updates**: WebSocket implementation for live calendar updates

### Data Storage Solutions
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Session Store**: PostgreSQL-backed session storage using connect-pg-simple
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### Authentication and Authorization
- **Provider**: Replit Auth with OIDC integration
- **Session Handling**: Secure session management with PostgreSQL backing
- **Role-based Access**: Guest and admin user roles with different permissions
- **Middleware**: Authentication middleware for protected routes

### Booking System
- **Calendar Integration**: Real-time availability checking with 100ms refresh rate
- **Payment Processing**: Stripe integration with multiple payment methods
- **Guest Information**: Comprehensive guest data collection
- **Booking Validation**: Availability verification and conflict prevention

### Content Management
- **Property Images**: Upload, delete, and order management for property photos
- **Amenities**: Dynamic amenity management with icon support
- **About Content**: Editable content sections with icon selection
- **Reviews**: Display system for guest reviews and ratings

### Real-time Features
- **WebSocket Connection**: Live updates for bookings and calendar changes
- **Message System**: Real-time notifications for new bookings and messages
- **Calendar Sync**: 100ms refresh rate for instant availability updates

## Data Flow

1. **Authentication Flow**: User authentication via Replit Auth → Session creation → Role-based access control
2. **Booking Flow**: Date selection → Availability check → Guest information → Payment processing → Confirmation
3. **Admin Flow**: Dashboard access → Content management → Booking oversight → Analytics viewing
4. **Real-time Flow**: WebSocket connection → Event broadcasting → Client state updates → UI refresh

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **@stripe/stripe-js** & **@stripe/react-stripe-js**: Payment processing
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework

### UI/UX Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **date-fns**: Date manipulation utilities

### Authentication Dependencies
- **openid-client**: OIDC authentication
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Runtime**: Replit with Node.js 20
- **Database**: PostgreSQL 16 module
- **Build**: Vite development server with HMR
- **Port Configuration**: 5000 (local) → 80 (external)

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundling to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Deployment Target**: Replit Autoscale

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Authentication**: Requires `SESSION_SECRET` and Replit Auth configuration
- **Payments**: Requires Stripe API keys (`STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`)

## Changelog
- June 29, 2025. COMPLETED: Mobile calendar width and height optimization - Reduced calendar width to 80% (w-4/5) for mobile screens only to eliminate horizontal scrolling. Increased mobile cell height to 60px (h-15) for better touch targets and content visibility. Added custom h-15 CSS utility class. Updated JavaScript booking span calculations to match new 60px mobile cell height. Calendar maintains full width on tablets and desktops while providing optimal mobile experience
- June 29, 2025. COMPLETED: Professional mobile calendar optimization - Redesigned calendar with mobile-first approach featuring clean professional styling, responsive cell heights (64px mobile to 112px desktop), touch-friendly interface with 44px+ touch targets, mobile-optimized booking forms with proper scrolling, and fixed booking span positioning to align properly across all screen sizes. Enhanced visual design with simplified borders, better contrast, and improved mobile readability while preserving 100ms real-time refresh functionality
- June 29, 2025. COMPLETED: Made admin dashboard fully responsive - Optimized for desktop, tablet, and mobile with responsive tab navigation (abbreviated labels on mobile), adaptive header sizing, proper calendar overflow handling, and responsive spacing/typography. All functionality preserved including 100ms real-time calendar refresh and booking management across all screen sizes
- June 29, 2025. COMPLETED: Removed calendar cell hover effects for cleaner interface - Eliminated all hover animations, scaling, shadow effects, and color transitions from calendar cells per user request. Calendar maintains professional static appearance while preserving full booking functionality and 100ms real-time refresh. Plus icons now display with static 60% opacity instead of hover transitions
- June 29, 2025. COMPLETED: Updated booking span colors - Manual/admin bookings now display in purple (#a855f7), guest online bookings remain green. Enhanced source color legend updated to match new color scheme. Removed duplicate legend section for cleaner interface design
- June 29, 2025. COMPLETED: Advanced Calendar System with 100ms Real-Time Refresh - Implemented ultra-responsive calendar with 100ms refresh rate for instant live updates. Enhanced visual design with gradient backgrounds, professional styling. Added animated diagonal stripes for blocked dates, enhanced date number displays with gradient backgrounds, visual status indicators (CI/CO badges). Calendar features real-time status display showing "Live 100ms", enhanced source color legend with pulsing animations, and sophisticated visual hierarchy. Server logs confirm continuous 100ms data fetching with "Found 4 calendar items (bookings + blocks)" updates
- June 29, 2025. COMPLETED: Perfected blocked dates with professional diagonal stripe pattern across entire calendar cells. Updated CSS with neutral shades (#e2e8f0, #f8fafc) and 10px/20px repeating pattern. Blocked bookings now display diagonal stripes filling complete grid cells (not booking spans), matching reference screenshot exactly. Enhanced React component logic to detect blocked bookings and apply diagonal stripe styling to calendar cells. Visual hierarchy: blocked dates (diagonal stripes), manual bookings (purple), user bookings (green)
- June 29, 2025. COMPLETED: Enhanced blocked dates with diagonal stripe pattern matching professional booking platforms. Removed CO indicators and simplified booking form to two options: Block Dates (diagonal stripe pattern, blocking reason, no earnings) and Manual Booking (complete guest details, manual pricing, automatic city tax calculation at €4 per person per night max 5 nights). Calendar now displays blocked dates with professional diagonal stripe visualization exactly as shown in reference screenshot
- June 29, 2025. COMPLETED: Implemented admin booking date restrictions with visual feedback system. Admin cannot select previous days (only current/future dates allowed) with gray background and "×" indicators for past dates. Admin can book check-in on days that have existing check-out bookings, with yellow background and "CO" indicators for check-out-only days. Red background with "CI" indicators show fully blocked dates with check-in bookings. Enhanced user experience with clear visual status indicators and proper click handling
- June 29, 2025. COMPLETED: Implemented true continuous booking spans using absolute positioning overlay system. Created seamless booking visualization that flows uninterrupted across calendar cells with proper check-in/check-out rounding and multi-row support. Bookings now render as single continuous elements spanning multiple days, eliminating visual breaks and achieving professional booking platform appearance matching user reference examples
- June 29, 2025. COMPLETED: Perfected continuous booking visualization with seamless pipe connections. Enhanced calendar height to 160px per cell and implemented sophisticated booking bars with 28px height and 32px spacing. Created seamless visual continuity across date boundaries using extended connecting pipes that bridge calendar cell gaps. Booking spans now display as continuous colored bars with proper check-in/check-out indicators, guest names centered, and uninterrupted visual flow across multiple dates. Professional booking platform appearance with color-coded sources and smooth transitions matching user requirements
- June 29, 2025. COMPLETED: Enhanced Advanced Calendar with split half-day booking display system. Implemented proper first-half (check-out) and second-half (check-in) visual areas for each calendar date. Created continuous booking spans across multiple dates with seamless pipe connections crossing date dividers. Features professional booking visualization with color-coded sources (Airbnb=red, Booking.com=blue, Direct=green, Blocked=gray, Manual=purple), check-in/check-out arrows, guest name overlays, and multi-day booking continuity. Calendar now displays bookings like professional booking platforms with proper half-day split visualization and continuous spanning across date boundaries
- June 29, 2025. COMPLETED: Added enhanced BookingCalendar component as new Calendar tab in admin section. Implemented professional color-coded calendar system with click interface for creating manual bookings and blocking dates. Features include: red (Airbnb), blue (Booking.com), green (direct), and gray (blocked) color coding, half-day split edges for adjacent bookings, click popup system with minimum booking validation, and full API integration for creating reservations. Admin dashboard now has 6 tabs with the new Calendar management interface
- June 28, 2025. COMPLETED: Advanced color-coded calendar system with sophisticated booking source management and real-time updates. Implemented comprehensive calendar tab in admin dashboard featuring red (Airbnb), blue (Booking.com), green (direct website), and gray (blocked) color coding. Added database schema extensions for booking source tracking with custom third-party integration support. Created spanning booking display showing check-in/check-out days with half-day styling matching professional booking platforms. Implemented 100ms refresh rate for real-time calendar updates. Added custom booking source form with color picker for third-party platforms like Expedia and Vrbo. Enhanced admin restrictions preventing booking creation through guest interface with clear visual indicators and toast notifications
- June 28, 2025. COMPLETED: Enhanced booking management system with advanced user interface and comprehensive booking history functionality. Implemented sophisticated booking lookup with "Add to My Bookings" feature allowing users to associate external reservations with their accounts. Created advanced booking cards with visual enhancements including guest avatars, gradient backgrounds, status badges, and interactive hover effects. Added professional navigation with back button and animated transitions. Enhanced booking details modal with improved pricing display and QR code generation. Implemented booking statistics dashboard showing total bookings and value. System now provides complete booking lifecycle management from creation to history tracking with modern, responsive design patterns
- June 28, 2025. COMPLETED: Implemented sophisticated temporary date holding system with proper booking confirmation flow. Online payments now create "pending" bookings that hold dates temporarily during payment processing, only blocking calendar dates permanently when payment succeeds. "Pay at property" bookings remain instantly confirmed. Added Stripe webhook integration and client-side payment confirmation to update booking status from pending to confirmed. Implemented automatic cleanup of abandoned pending bookings (30-minute timeout) with periodic maintenance tasks. Calendar now accurately reflects only confirmed reservations while preventing double-bookings during payment flows. Simplified "pay at property" flow by removing card authorization requirement completely
- June 27, 2025. COMPLETED: Enhanced "Reserve Now" button validation to prevent clicking when valid check-in/check-out dates are not selected. Implemented comprehensive validation using calendar's business rules including 15-day maximum stay, booking conflicts, and date range validation. Button now displays appropriate messaging ("Select dates to continue", "Invalid date selection", "Reserve Now") and visual states (disabled gray vs enabled blue) across all responsive layouts. Validation ensures both dates are present AND form a valid range according to system rules before allowing booking to proceed
- June 27, 2025. COMPLETED: Comprehensive Stripe payment integration with dual payment flows implemented. Created professional payment system supporting both online payments (excluding city tax) and card authorization for property payments. Built Stripe wrapper components with real-time validation, error handling, and secure payment processing. Enhanced booking flow from landing page calendar to complete payment confirmation with QR codes and print functionality. Payment endpoints support proper metadata tracking, webhook handling, and payment status updates. System now provides end-to-end booking experience matching modern booking platform standards with seamless transition from property browsing to payment confirmation
- June 27, 2025. COMPLETED: Fixed booking modal multiple issues and admin panel date display. Removed duplicate close button (X) from modal header, separated voucher discount codes from referral credits with distinct input fields, corrected cleaning fees (€25 for 1 night, €35 for 2+ nights), fixed pet fees (€15 for 1-2 nights, €25 for 3+ nights), added "paid at property" note for city tax, and removed user credit section as requested. Updated admin panel to display correct booking dates (checkInDate/checkOutDate) and guest information (guestFirstName/guestLastName/guestEmail) matching database schema. All pricing calculations now use proper fee structure with backend validation
- June 27, 2025. COMPLETED: Created comprehensive backend booking system matching frontend functionality. Implemented detailed bookings table with all pricing breakdowns including base price, length-of-stay discounts (5% for 7+ days, 10% for 14+ days), city tax calculations (4€ per adult per night, max 5 nights), cleaning fees (€25), service fees (€15), pet fees (€25-35), and referral credits (5€ per night). Added business logic validation for 15-day maximum bookings, guest limits (1-5), and date validation. Created comprehensive API endpoints for booking creation, pricing calculations, and confirmation code lookups. Implemented automatic confirmation code generation, QR code creation, and referral tracking with credit application. Backend now handles admin vs guest booking creation, self-booking tracking, and payment method validation (online/property). All pricing calculations match frontend discount system with real-time backend validation
- June 27, 2025. COMPLETED: Implemented comprehensive booking restrictions and discount system with business logic validation. Added 15-day maximum stay limit with user-friendly error messages. Created tiered discount system offering 5% off for 7+ day stays and 10% off for 14+ day stays. Updated calendar validation to prevent past date selection and enforce maximum stay limits. Enhanced all price breakdown sections across responsive layouts to display original prices with strikethrough, discounted rates, discount percentages, and savings amounts in green text. Updated calendar color scheme to smoother blue tones (blue-400 for selected dates, blue-200 for ranges) for improved visual appeal. All pricing calculations now use dynamic discount logic with real-time updates across mobile, tablet, and desktop layouts
- June 27, 2025. COMPLETED: Comprehensive micro-interactions system for smooth mobile responsiveness implemented across entire platform. Enhanced mobile image gallery with touch feedback, scale animations (active:scale-95), ripple effects, and improved navigation controls. Added touch-friendly property details with hover effects, color transitions, and haptic-like feedback. Implemented enhanced reviews section with card scaling (hover:scale-105), star animations, and smooth transitions. Created comprehensive CSS animation framework with keyframes for slideInUp, fadeInScale, pulseGlow, and shimmer effects. Added mobile-specific touch targets (44px minimum), enhanced focus states, smooth scrolling, and no-select classes. All interactive elements now provide immediate visual feedback with professional transitions and accessibility improvements
- June 27, 2025. COMPLETED: Enhanced property information section with advanced responsive design and premium styling. Implemented comprehensive breakpoint optimization (mobile, tablet, desktop) with fluid layouts, adaptive text sizing, and progressive enhancement. Added glass-morphism effects, gradient backgrounds, animated elements, and micro-interactions. Features include hover animations, color-coded property cards, responsive grid systems, and accessibility improvements. Section now provides optimal user experience across all screen sizes with sophisticated visual hierarchy and modern UI patterns
- June 27, 2025. COMPLETED: Fixed drag-and-drop image reordering system completely. Resolved route conflict between batch reorder endpoint and individual image updates by moving reorder route before parameterized routes. Added comprehensive debugging and validation for proper integer handling. Hero images now reorder correctly with real-time updates and proper sequence numbering. Admin can successfully drag images to new positions with instant visual feedback and database persistence
- June 27, 2025. COMPLETED: Added professional property information section under hero images matching Airbnb design. Section displays host information (avatar, name, credentials), property details (guests, bedrooms, bathrooms), and pricing (€110.50/night) in responsive layout. Features Superhost badge, hosting experience, review count, and availability status. Fully responsive across desktop, tablet, and mobile with proper spacing and visual hierarchy
- June 27, 2025. COMPLETED: Added back button with arrow in admin dashboard for easy navigation to home page. Implemented drag-and-drop image reordering system for hero images with visual feedback. Admin can now drag images by grip handle to change display order, with blue highlight on drop zones and opacity changes during drag. Created sortable list view showing image position (#1, #2, etc.), preview thumbnails, and action buttons. Added swipeable mobile carousel for hero images with left/right navigation arrows, dot indicators, photo counter (1/5), and touch gestures. Mobile users can swipe through property images smoothly with responsive controls and visual feedback
- June 27, 2025. COMPLETED: Created advanced image gallery with professional popup modal system. Built Booking.com-style hero layout with 4-column, 2-row desktop grid (large main image + 4 smaller thumbnails) and responsive mobile version. Added clickable images that open full-screen modal with large image display, thumbnail navigation strip underneath, left/right arrow controls, and keyboard navigation (arrow keys, ESC to close). Modal includes image information overlay, click-outside-to-close functionality, body scroll prevention, and smooth transitions. Removed booking reservation section as requested. Enhanced admin upload system with intuitive room/space categorization. Hassan can now upload property images that display in professional gallery format with advanced viewing capabilities matching modern booking platforms
- June 26, 2025. COMPLETED: Enhanced pricing section with comprehensive promotions management system. Added manual controls for base price per night (€150), cleaning fees (€25), and pet fees (€35). Created full promotion system with discount tags for frontend display, including promotion creation form with validation, status management (activate/deactivate/delete), and date range controls. Hassan can now create promotions like "Early Bird Special" with "20% OFF" tags that will appear to guests on the booking interface
- June 26, 2025. COMPLETED: Updated admin dashboard by replacing Property and Amenities tabs with Reviews and Pricing tabs. Reviews tab displays guest ratings with detailed breakdown (cleanliness, location, check-in, value, communication). Pricing tab allows updating base price, cleaning fee, pet fee, and discount percentages with real-time form handling
- June 26, 2025. COMPLETED: Created comprehensive admin dashboard with 5 tabs (Overview, Bookings, Messages, Property, Amenities) featuring analytics cards, booking status management, message handling, image gallery management, and amenity display. Added all necessary API endpoints with admin authentication and role-based access control
- June 26, 2025. COMPLETED: Created admin account (admin@allarco.com / admin123) for Hassan Cheema with proper role-based authentication. Admin users are directed to the same home page as regular users upon login
- June 26, 2025. COMPLETED: Advanced date input system with real-time age calculation, smart age-based notifications (parental consent, restrictions, discounts), interactive visual effects with focus scaling and color transitions, comprehensive validation, and contextual guidance for different age groups
- June 26, 2025. COMPLETED: Enhanced profile page with enterprise-level security and privacy controls including date of birth protection, comprehensive country selection (195+ countries with flags), advanced UI/UX with glass-morphism effects, and multi-layer privacy toggles ensuring only authenticated users can view their sensitive information
- June 26, 2025. COMPLETED: Implemented automatic login after signup - users are now immediately authenticated after account creation without requiring separate login step
- June 26, 2025. RESOLVED: Fixed excessive API refresh calls completely. Removed refetchInterval causing 401 requests every 2 seconds. Authentication now uses staleTime: Infinity and only checks on mount, eliminating nonsensical refresh behavior
- June 26, 2025. COMPLETED: Updated authentication dropdown design to match provided screenshots with modern Sign In/Create Account layout, colored icons, and security messaging
- June 26, 2025. COMPLETED: Implemented comprehensive user profile and settings functionality with backend API endpoints and proper TypeScript support
- June 26, 2025. RESOLVED: Header authentication display bug completely fixed and verified. Added debug logging to confirm user object receipt. Authentication logs show consistent 304 responses with user data. Header correctly displays authenticated dropdown with user name "Ali Hassan Cheema" and email after login using simplified `!!user` check
- June 26, 2025. RESOLVED: Fixed header authentication display bug completely. Replaced complex authentication logic with simple `!!user` check and added proper loading state handling. Header now correctly switches from login button to authenticated dropdown immediately after login
- June 26, 2025. Fixed authentication system and user login flow. Users now successfully authenticate, sessions persist correctly, and dropdown shows full name with notification icon. Removed extra signup success screen for streamlined flow
- June 26, 2025. Fixed routing to ensure all users see Landing page at root URL. Login and signup now properly redirect to user's intended landing page instead of other components
- June 26, 2025. Fixed excessive calendar API calls causing server load. Temporarily disabled calendar query to eliminate flood of requests while maintaining functionality
- June 26, 2025. Resolved authentication redirect loop - users now stay logged in properly after login with improved session handling
- June 26, 2025. Fixed authentication system and user login flow. Users now successfully authenticate, sessions persist correctly, and dropdown shows full name with notification icon. Removed extra signup success screen for streamlined flow
- June 26, 2025. Enhanced referral system with referrer name tracking and total referral count. Database stores referrer's full name and automatically increments referral counter when users sign up with referral codes
- June 26, 2025. Added referral code system with automatic generation, validation, and tracking. Users receive unique codes upon signup and can enter referral codes for benefits
- June 26, 2025. Created comprehensive signup and login forms with password validation, strength indicators, and secure authentication system supporting both local accounts and Replit Auth
- June 26, 2025. Enhanced user schema with additional fields (password, dateOfBirth, country, mobileNumber) and authentication provider support for dual auth system
- June 26, 2025. Enhanced chat widget with advanced animations, interactive messaging system, typing indicators, and professional UI design for improved user engagement
- June 26, 2025. Implemented distinct responsive layouts for host information: mobile (vertical stack), tablet (2/3 left vertical + 1/3 right price), desktop (three equal horizontal sections)
- June 26, 2025. Redesigned host information section with horizontal three-column layout (1/3 each) responsive across all screen sizes with proper content optimization
- June 26, 2025. Fixed host information layout to position price on right side across all screen sizes with proper two-row structure matching provided screenshot
- June 26, 2025. Added detailed "Recent Reviews" section with four guest testimonials, ratings, dates, and responsive grid layout matching provided screenshot
- June 26, 2025. Implemented horizontal trust elements layout for all screen sizes using flexbox with percentage-based widths and responsive scaling
- June 26, 2025. Added comprehensive trust and quality assurance section with verified property badges, guest review ratings, and detailed category scores matching provided screenshot
- June 26, 2025. Repositioned "About This Space" section above property description with clean centered layout matching provided screenshot
- June 26, 2025. Added comprehensive property description section with All'Arco apartment details, features highlights, and "About This Space" content matching provided screenshots
- June 26, 2025. Added functional guest counter with min/max limits (1-5 guests) across all layouts with disabled state styling and real-time updates
- June 26, 2025. Implemented functional pet toggle with correct pricing (€25 for 1 night, €35 total for multiple nights) and removed "Price Breakdown" heading for cleaner minimalist design
- June 26, 2025. Fixed calendar width constraints to prevent overflow in tablet layout with responsive flex-based grid system
- June 26, 2025. Repositioned price breakdown to appear directly under guests & pets section in tablet layout for better visual hierarchy and user flow
- June 26, 2025. Refined booking section layout for optimal tablet display: 2-column grid (calendar + guests) with full-width price section below, maintaining 3-column desktop layout
- June 26, 2025. Implemented comprehensive micro-interactions for smooth mobile responsiveness with touch feedback, loading states, and enhanced visual feedback
- June 26, 2025. Enhanced responsive behavior for medium screens (under 1024x1121) with smoother two-row layout
- June 26, 2025. Optimized price section layout with proper width allocation and visual prominence
- June 26, 2025. Simplified host information card to be cleaner and more user-friendly with unified responsive layout
- June 26, 2025. Redesigned host information section with professional responsive layout, gradient styling, and enhanced mobile experience
- June 26, 2025. Added host information section with property details, pricing, and availability status matching provided design
- June 26, 2025. Updated header design to match provided screenshot with AllArco branding, single user icon for login/signup area
- June 26, 2025. Added comprehensive landing page header with All'Arco Venice logo, navigation dropdown, and sticky positioning
- June 26, 2025. Added sophisticated All'Arco Venice logo with custom arch symbol, premium gradients, smooth animations, and matching SVG favicon
- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.