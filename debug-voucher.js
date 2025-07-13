import { db } from './server/db.ts';
import { vouchers } from './shared/schema.ts';
import { eq, and, lte, gte } from 'drizzle-orm';

async function debugVoucher() {
  try {

    const now = new Date();

    // Get the voucher without date constraints
    const allVouchers = await db.select().from(vouchers).where(eq(vouchers.code, 'WELCOME20'));

    if (allVouchers.length > 0) {
      const voucher = allVouchers[0];








      // Test date conditions




      // Test booking amount check
      const testBookingAmount = 206;
      const minAmount = parseFloat(voucher.minBookingAmount || '0');




    }
    
    // Now test the same query as the validateVoucher function
    const validVouchers = await db
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.code, 'WELCOME20'),
          eq(vouchers.isActive, true),
          lte(vouchers.validFrom, now),
          gte(vouchers.validUntil, now)
        )
      );

  } catch (error) {

  }
}

debugVoucher().then(() => process.exit(0));