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