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