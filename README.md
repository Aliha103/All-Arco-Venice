# All'Arco Venice - Apartment Booking System

A comprehensive luxury apartment booking system built for All'Arco Venice, featuring real-time booking management, admin dashboard, payment processing, and guest management.

## 🏛️ Project Overview

This is a full-stack web application for managing luxury apartment bookings in Venice. The system provides a seamless booking experience for guests while offering powerful administrative tools for property managers.

### Key Features

- **🏠 Property Showcase**: Beautiful image gallery and detailed property information
- **📅 Real-time Booking Calendar**: Advanced calendar with availability tracking
- **💳 Payment Processing**: Integrated Stripe payment system
- **👥 User Management**: Multi-role authentication (Guest, Admin, Team Member)
- **🔐 Security**: 2FA authentication with Google Authenticator
- **📊 Admin Dashboard**: Comprehensive booking and revenue analytics
- **🎁 Promotion System**: Vouchers, referral codes, and seasonal promotions
- **📱 Responsive Design**: Mobile-first approach with modern UI
- **🔄 Real-time Updates**: WebSocket connections for live booking updates
- **📈 Analytics**: Detailed reporting and business insights

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible UI components
- **Wouter** for routing
- **React Query** for server state management
- **Framer Motion** for animations
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **Stripe** for payment processing
- **WebSocket** for real-time updates
- **Passport.js** for authentication
- **Speakeasy** for 2FA
- **Multer** for file uploads

### Authentication & Security
- **Multi-provider auth** (Google OAuth, Local, Replit)
- **2FA** with Google Authenticator
- **Role-based access control**
- **Session management** with secure cookies
- **CSRF protection**

### Database
- **PostgreSQL** with comprehensive schema
- **Drizzle ORM** for type-safe database operations
- **Migration system** for schema updates

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Stripe account for payments
- Google OAuth credentials (optional)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aliha103/All-Arco-Venice.git
   cd All-Arco-Venice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/apartment_booking
   
   # Session Secret
   SESSION_SECRET=your-super-secret-session-key
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # App Configuration
   NODE_ENV=development
   PORT=3000
   ADMIN_EMAIL=admin@allarco.com
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```
/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── services/       # API services
│   │   └── styles/         # CSS files
│   └── index.html          # HTML entry point
├── server/                 # Backend Express application
│   ├── db/                 # Database schemas
│   ├── auth.ts             # Authentication logic
│   ├── routes.ts           # API routes
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
├── migrations/             # Database migrations
├── uploads/                # File uploads directory
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (both frontend and backend)
- `npm run dev:server` - Start only the backend server
- `npm run dev:client` - Start only the frontend development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## 🎯 Usage

### For Guests
1. **Browse**: View property images and amenities
2. **Book**: Select dates and guest details
3. **Pay**: Secure payment via Stripe
4. **Manage**: View booking confirmations and details

### For Admins
1. **Dashboard**: Access comprehensive booking analytics
2. **Manage Bookings**: Create, edit, and cancel bookings
3. **Pricing**: Set up seasonal pricing and promotions
4. **Team**: Manage team members with role-based access
5. **Analytics**: View revenue reports and booking trends

### Key Features in Detail

#### 🗓️ Advanced Booking Calendar
- Visual availability display
- Drag-to-select date ranges
- Real-time availability updates
- Multi-booking support for same dates

#### 💰 Dynamic Pricing System
- Base pricing with seasonal adjustments
- Length-of-stay discounts (7+ days: 5%, 14+ days: 10%)
- Cleaning fees and pet fees
- City tax calculation (€4 per adult per night, max 5 nights)
- Referral credits (€5 per night)

#### 🎁 Promotion Management
- Seasonal promotions with custom discounts
- Voucher system with unique codes
- Referral program with automatic credit allocation
- Promo code validation and application

#### 📊 Admin Dashboard
- Real-time booking statistics
- Revenue analytics and charts
- Guest management system
- Team member permissions
- Payment tracking and reconciliation

## 🔐 Security Features

- **Authentication**: Multi-provider support (Google, Local, Replit)
- **Authorization**: Role-based access control (Guest, Admin, Team Member)
- **2FA**: Google Authenticator integration for admin accounts
- **Session Management**: Secure session handling with logout tracking
- **Input Validation**: Comprehensive validation using Zod schemas
- **CSRF Protection**: Built-in CSRF token validation
- **Secure Headers**: Security headers for production deployment

## 📦 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **users**: User accounts with role-based permissions
- **bookings**: Detailed booking information with pricing breakdown
- **sessions**: Session storage for authentication
- **propertyImages**: Property image management
- **reviews**: Guest reviews and ratings
- **amenities**: Property amenities list
- **promotions**: Seasonal promotions and discounts
- **vouchers**: Voucher codes and usage tracking

## 🌐 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/signup` - User registration
- `GET /auth/user` - Get current user

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/calculate-pricing` - Calculate booking price

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/bookings` - Admin booking management
- `POST /api/admin/promotions` - Create promotions
- `GET /api/admin/team` - Team management

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
Make sure to set all required environment variables in your production environment, especially:
- `DATABASE_URL` - Production database connection
- `SESSION_SECRET` - Strong session secret
- `STRIPE_SECRET_KEY` - Production Stripe key
- `NODE_ENV=production`

### Recommended Hosting
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Railway, Heroku, or any Node.js hosting
- **Database**: PostgreSQL on Railway, Supabase, or managed PostgreSQL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Developer**: Ali Hassan Cheema
- **Project**: All'Arco Venice Booking System
- **Contact**: For support and inquiries

## 🔄 Version History

- **v1.0.0**: Initial release with core booking functionality
- **v1.1.0**: Added admin dashboard and team management
- **v1.2.0**: Implemented promotion system and vouchers
- **v1.3.0**: Added real-time updates and WebSocket integration
- **v1.4.0**: Enhanced pricing system and analytics

## 🆘 Support

For technical support or questions:
1. Check the documentation above
2. Review the code comments
3. Create an issue in the GitHub repository
4. Contact the development team

---

**Built with ❤️ for All'Arco Venice**
