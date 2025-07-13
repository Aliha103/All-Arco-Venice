import { Router } from 'express';
import { isAuthenticated } from './localAuth';
import { storage } from './storage';
import axios from 'axios';
import ical from 'node-ical';

const router = Router();

// Test database connection on module load
(async () => {
  try {

    const testIntegrations = await storage.getPMSIntegrations();

  } catch (error) {

  }
})();

// Add process error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {

  // Don't exit the process
});

process.on('uncaughtException', (error) => {

  // Don't exit the process for PMS-related errors
  if (error.message && error.message.includes('PMS')) {

  } else {
    // Re-throw non-PMS errors
    throw error;
  }
});

// Middleware to ensure admin access
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    console.log('🔐 Checking admin access...');
    console.log('👤 User object:', req.user);
    
    let userId;
    let user;
    
    // Handle different authentication types
    if (req.user.claims) {
      // Replit auth user
      userId = req.user.claims.sub;
      user = await storage.getUser(userId);
    } else if (req.user.id) {
      // Local auth user (admin)
      userId = req.user.id;
      user = req.user; // User is already loaded for local auth
    } else {
      console.error('❌ Unknown user structure');
      return res.status(401).json({ message: 'Invalid user session' });
    }
    
    console.log('👥 Found user:', user?.email, 'Role:', user?.role);
    
    if (user?.role !== 'admin') {
      console.error('❌ Access denied - user is not admin');
      return res.status(403).json({ message: 'Access denied - admin role required' });
    }
    
    console.log('✅ Admin access granted');
    next();
  } catch (error) {
    console.error('❌ Authorization error:', error);
    res.status(500).json({ message: 'Authorization error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Simple test route (no auth required)
router.get('/test', async (req, res) => {
  console.log('🎉 PMS Test route hit!');
  res.json({ message: 'PMS routes are working!', timestamp: new Date().toISOString() });
});

// Debug route to test auth
router.get('/test-auth', isAuthenticated, async (req, res) => {
  console.log('🔎 Testing authentication...');
  console.log('👤 User object:', req.user);
  res.json({ user: req.user, message: 'Auth test successful' });
});

// Test route to check PMS tables
router.get('/test-tables', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    console.log('🗺️ Testing PMS tables...');
    
    // Test each table
    const integrations = await storage.getPMSIntegrations();
    console.log(`🔌 Found ${integrations.length} integrations`);
    
    res.json({ 
      success: true, 
      integrations: integrations.length,
      message: 'PMS tables are working correctly'
    });
  } catch (error) {
    console.error('❌ PMS tables test failed:', error);
    res.status(500).json({ 
      message: 'PMS tables test failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all PMS integrations
router.get('/integrations', isAuthenticated, requireAdmin, async (req, res) => {

  try {
    const integrations = await storage.getPMSIntegrations();

    res.json(integrations);
  } catch (error) {

    res.status(500).json({ message: 'Failed to fetch integrations' });
  }
});

// Add new PMS integration
router.post('/integrations', isAuthenticated, requireAdmin, async (req, res) => {


  try {
    const { name, method, details } = req.body;
    
    if (!name || !method || !details) {

      return res.status(400).json({ message: 'Missing required fields' });
    }

    const integration = await storage.createPMSIntegration({
      name,
      method,
      details,
      status: 'active',
      bookingsCount: 0
    });

    // Trigger initial sync safely
    setTimeout(async () => {

      try {
        const result = await syncIntegration(integration.id);

      } catch (syncError) {

        // Don't let this crash the server
      }
    }, 1000);
    
    res.json(integration);
  } catch (error) {

    res.status(500).json({ message: 'Failed to create integration' });
  }
});

// Delete PMS integration
router.delete('/integrations/:id', isAuthenticated, requireAdmin, async (req, res) => {
  console.log('🚫 ROUTE HIT: Starting integration deletion process...');
  
  try {
    const { id } = req.params;
    console.log(`🆔 Integration ID received: ${id}`);
    
    if (!id) {
      console.error('❌ Missing integration ID');
      return res.status(400).json({ message: 'Integration ID is required' });
    }
    
    // Direct database deletion using db from storage to bypass any schema issues
    console.log(`🗑️ Attempting direct database deletion for: ${id}`);
    
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const { pmsIntegrations, pmsBookings, pmsReviews, pmsMessages } = await import('./db/pms-schema');
    
    // Delete related records first to avoid foreign key constraint violations
    console.log(`🗑️ Deleting related pms_bookings records for integration: ${id}`);
    const deletedBookings = await db.delete(pmsBookings).where(eq(pmsBookings.integrationId, id)).returning();
    console.log(`🔌 Deleted ${deletedBookings.length} bookings`);
    
    console.log(`🗑️ Deleting related pms_reviews records for integration: ${id}`);
    const deletedReviews = await db.delete(pmsReviews).where(eq(pmsReviews.integrationId, id)).returning();
    console.log(`🔌 Deleted ${deletedReviews.length} reviews`);
    
    console.log(`🗑️ Deleting related pms_messages records for integration: ${id}`);
    const deletedMessages = await db.delete(pmsMessages).where(eq(pmsMessages.integrationId, id)).returning();
    console.log(`🔌 Deleted ${deletedMessages.length} messages`);
    
    // Now delete the integration itself
    console.log(`🗑️ Deleting pms_integration record: ${id}`);
    const result = await db.delete(pmsIntegrations).where(eq(pmsIntegrations.id, id)).returning();
    console.log(`🔌 Direct deletion result:`, result);
    
    if (result.length === 0) {
      console.error(`❌ Integration not found: ${id}`);
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    console.log(`✅ Successfully deleted PMS integration: ${id}`);
    res.json({ success: true, message: 'Integration deleted successfully', deleted: result[0] });
    
  } catch (error) {
    console.error('❌ Error deleting PMS integration:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return detailed error information
    res.status(500).json({ 
      message: 'Failed to delete integration', 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
});

// Sync specific integration
router.post('/integrations/:id/sync', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await syncIntegration(id);
    res.json(result);
  } catch (error) {

    res.status(500).json({ message: 'Failed to sync integration' });
  }
});

// Get PMS bookings
router.get('/bookings', isAuthenticated, requireAdmin, async (req, res) => {

  try {
    const bookings = await storage.getPMSBookings();

    res.json(bookings);
  } catch (error) {

    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

// Create PMS bookings (batch insert)
router.post('/bookings', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { bookings } = req.body;
    
    if (!bookings || !Array.isArray(bookings)) {
      return res.status(400).json({ message: 'Invalid bookings data' });
    }
    
    // Validate each booking
    for (const booking of bookings) {
      if (!booking.platform || !booking.summary || !booking.start || !booking.end) {
        return res.status(400).json({ 
          message: 'Each booking must have platform, summary, start, and end fields' 
        });
      }
    }
    
    // Insert bookings
    const insertedBookings = [];
    for (const booking of bookings) {
      const insertedBooking = await storage.createPMSBooking({
        platform: booking.platform,
        summary: booking.summary,
        start: booking.start,
        end: booking.end,
        guestName: booking.guestName || 'Guest',
        status: booking.status || 'confirmed',
        revenue: booking.revenue || 0
      });
      insertedBookings.push(insertedBooking);
    }
    
    res.status(200).json({ 
      success: true, 
      count: insertedBookings.length,
      bookings: insertedBookings 
    });
  } catch (error) {

    res.status(500).json({ error: 'Database insertion error.' });
  }
});

// Get PMS reviews
router.get('/reviews', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const reviews = await storage.getPMSReviews();
    res.json(reviews);
  } catch (error) {

    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// Create PMS reviews (batch insert)
router.post('/reviews', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { reviews } = req.body;
    
    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({ message: 'Invalid reviews data' });
    }
    
    // Validate each review
    for (const review of reviews) {
      if (!review.platform || !review.rating || !review.guestName) {
        return res.status(400).json({ 
          message: 'Each review must have platform, rating, and guestName fields' 
        });
      }
      
      // Validate rating is between 1 and 5
      if (review.rating < 1 || review.rating > 5) {
        return res.status(400).json({ 
          message: 'Rating must be between 1 and 5' 
        });
      }
    }
    
    // Insert reviews
    const insertedReviews = [];
    for (const review of reviews) {
      const insertedReview = await storage.createPMSReview({
        platform: review.platform,
        rating: review.rating,
        comment: review.comment || '',
        guestName: review.guestName,
        date: review.date || new Date().toISOString()
      });
      insertedReviews.push(insertedReview);
    }
    
    res.status(200).json({ 
      success: true, 
      count: insertedReviews.length,
      reviews: insertedReviews 
    });
  } catch (error) {

    res.status(500).json({ error: 'Database insertion error.' });
  }
});

// Get PMS messages
router.get('/messages', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const messages = await storage.getPMSMessages();
    res.json(messages);
  } catch (error) {

    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Create PMS messages (batch insert)
router.post('/messages', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Invalid messages data' });
    }
    
    // Validate each message
    for (const message of messages) {
      if (!message.platform || !message.sender || !message.content) {
        return res.status(400).json({ 
          message: 'Each message must have platform, sender, and content fields' 
        });
      }
    }
    
    // Insert messages
    const insertedMessages = [];
    for (const message of messages) {
      const insertedMessage = await storage.createPMSMessage({
        platform: message.platform,
        sender: message.sender,
        content: message.content,
        timestamp: message.timestamp || new Date().toISOString(),
        read: false
      });
      insertedMessages.push(insertedMessage);
    }
    
    res.status(200).json({ 
      success: true, 
      count: insertedMessages.length,
      messages: insertedMessages 
    });
  } catch (error) {

    res.status(500).json({ error: 'Database insertion error.' });
  }
});

// Mark message as read
router.put('/messages/:id/read', isAuthenticated, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.markPMSMessageAsRead(id);
    res.json({ success: true });
  } catch (error) {

    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// Sync integration function
async function syncIntegration(integrationId: string) {

  try {
    const integration = await storage.getPMSIntegration(integrationId);
    if (!integration) {

      throw new Error('Integration not found');
    }

    // Wrap sync in try-catch to prevent crashes
    try {
      if (integration.method === 'ICAL') {
        await syncICALIntegration(integration);
      } else if (integration.method === 'API') {
        await syncAPIIntegration(integration);
      } else {

      }
    } catch (syncError) {

      // Don't throw here - we want to update status and return gracefully
      await storage.updatePMSIntegrationStatus(integrationId, 'error');
      return { success: false, message: `Sync failed: ${syncError.message}` };
    }
    
    // Update sync timestamp
    await storage.updatePMSIntegrationSync(integrationId);

    return { success: true, message: 'Integration synced successfully' };
  } catch (error) {

    try {
      await storage.updatePMSIntegrationStatus(integrationId, 'error');
    } catch (statusError) {

    }
    // Return error instead of throwing to prevent crash
    return { success: false, message: error.message || 'Unknown error' };
  }
}

// ICAL synchronization
async function syncICALIntegration(integration: any) {

  try {

    // Check if it's a localhost URL and adjust accordingly
    let url = integration.details;
    if (url.includes('localhost:4000') && !url.startsWith('http')) {
      url = `http://${url}`;
    }

    // Add timeout and size limits
    const response = await axios.get(url, {
      timeout: 30000, // 30 seconds timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max
      maxBodyLength: 50 * 1024 * 1024,
      headers: {
        'User-Agent': 'ApartmentBooker-PMS/1.0',
        'Accept': 'text/calendar, application/ics, text/plain'
      },
      validateStatus: (status) => status < 500 // Accept any status < 500
    });

    // Check if response is too large
    if (response.data.length > 10 * 1024 * 1024) { // 10MB

    }

    const events = ical.parseICS(response.data);

    // Log all event types found
    const eventTypes = Object.values(events).map((e: any) => e.type);

    const bookings = Object.values(events)
      .filter((event: any) => {
        const isVEvent = event.type === 'VEVENT';
        if (!isVEvent && event.type) {

        }
        return isVEvent;
      })
      .map((event: any) => {

        return {
          integrationId: integration.id,
          externalId: event.uid || `${integration.id}_${Date.now()}_${Math.random()}`,
          platform: integration.name,
          summary: event.summary || 'Booking',
          start: event.start instanceof Date ? event.start : new Date(event.start),
          end: event.end instanceof Date ? event.end : new Date(event.end),
          guestName: extractGuestName(event.summary),
          status: 'confirmed',
          revenue: extractRevenue(event.description)
        };
      });

    // Safety check for too many bookings (prevent memory issues)
    const MAX_BOOKINGS = 1000;
    if (bookings.length > MAX_BOOKINGS) {

      bookings.length = MAX_BOOKINGS;
    }

    // Check if bookings exist
    if (!bookings.length) {

    }

    // Save bookings to database
    let savedCount = 0;
    let errorCount = 0;
    
    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 10;
    for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
      const batch = bookings.slice(i, i + BATCH_SIZE);

      for (const booking of batch) {
        try {

          await storage.createPMSBooking(booking);
          savedCount++;
        } catch (createError) {
          errorCount++;

          // If we're getting too many errors, stop processing
          if (errorCount > 50) {

            break;
          }
        }
      }
      
      // Add a small delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < bookings.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update booking count
    if (bookings.length > 0) {

      await storage.updatePMSIntegrationBookingCount(integration.id, bookings.length);
    }

  } catch (error) {

    if (error.response) {

    }
    throw error;
  }
}

// API synchronization (placeholder - would need actual API implementations)
async function syncAPIIntegration(integration: any) {
  try {
    // This would be implemented based on each platform's API

    // Placeholder for API-based sync
    // const bookings = await fetchBookingsFromAPI(integration);
    // const reviews = await fetchReviewsFromAPI(integration);
    // const messages = await fetchMessagesFromAPI(integration);
    
    // For now, create sample data
    const sampleBooking = {
      integrationId: integration.id,
      externalId: `sample_${Date.now()}`,
      platform: integration.name,
      summary: `Sample booking from ${integration.name}`,
      start: new Date(),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000),
      guestName: 'Sample Guest',
      status: 'confirmed',
      revenue: 150
    };
    
    await storage.createPMSBooking(sampleBooking);
    await storage.updatePMSIntegrationBookingCount(integration.id, 1);
    
  } catch (error) {

    throw error;
  }
}

// Helper functions
function extractGuestName(summary: string): string {
  // Try to extract guest name from booking summary
  const match = summary?.match(/Guest:?\s*([^-,\n]+)/i);
  return match ? match[1].trim() : 'Guest';
}

function extractRevenue(description: string): number {
  // Try to extract revenue from booking description
  const match = description?.match(/(?:total|price|amount|revenue)[\s:]*([€$£]?[\d,]+\.?\d*)/i);
  if (match) {
    return parseFloat(match[1].replace(/[€$£,]/g, ''));
  }
  return 0;
}

// Export all PMS data
router.get('/export', isAuthenticated, requireAdmin, async (req, res) => {
  console.log('📊 ROUTE HIT: Exporting PMS data...');
  
  try {
    // Get all PMS data
    const integrations = await storage.getPMSIntegrations();
    console.log(`📄 Found ${integrations.length} integrations`);
    
    const { db } = await import('./db');
    const { pmsBookings, pmsReviews, pmsMessages } = await import('./db/pms-schema');
    
    // Get all related data
    const bookings = await db.select().from(pmsBookings);
    const reviews = await db.select().from(pmsReviews);
    const messages = await db.select().from(pmsMessages);
    
    console.log(`📄 Found ${bookings.length} bookings, ${reviews.length} reviews, ${messages.length} messages`);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        integrations: integrations.length,
        bookings: bookings.length,
        reviews: reviews.length,
        messages: messages.length
      },
      data: {
        integrations,
        bookings,
        reviews,
        messages
      }
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pms-export-${new Date().toISOString().split('T')[0]}.json"`);
    
    console.log('✅ Export completed successfully');
    res.json(exportData);
    
  } catch (error) {
    console.error('❌ Error exporting PMS data:', error);
    res.status(500).json({ 
      message: 'Failed to export data', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
