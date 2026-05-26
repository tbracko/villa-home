require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const ICAL = require('ical.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory cache for availability
let availabilityCache = {
  data: null,
  timestamp: null,
  ttl: 15 * 60 * 1000 // 15 minutes
};

function isCacheValid() {
  return availabilityCache.data &&
         availabilityCache.timestamp &&
         Date.now() - availabilityCache.timestamp < availabilityCache.ttl;
}

// ---- API Endpoints ----

// Public configuration consumed by the front-end
app.get('/api/config', (req, res) => {
  res.json({
    villaName: process.env.VILLA_NAME || 'Villa Home',
    nightlyRate: parseInt(process.env.NIGHTLY_RATE || 350),
    currency: process.env.CURRENCY || 'usd',
    cleaningFee: parseInt(process.env.CLEANING_FEE || 0),
    minNights: parseInt(process.env.MIN_NIGHTS || 2),
    maxGuests: parseInt(process.env.MAX_GUESTS || 6),
    bedrooms: parseInt(process.env.BEDROOMS || 3),
    bathrooms: parseInt(process.env.BATHROOMS || 3),
    landSize: process.env.LAND_SIZE || '1,200 m²',
    whatsappNumber: process.env.WHATSAPP_NUMBER || '',
    contactEmail: process.env.NOTIFICATION_EMAIL || '',
    airbnbUrl: process.env.AIRBNB_URL || '',
    siteUrl: process.env.SITE_URL || 'http://localhost:3000'
  });
});

// Availability from the Airbnb iCal export
app.get('/api/availability', async (req, res) => {
  try {
    if (isCacheValid()) {
      return res.json(availabilityCache.data);
    }

    const iCalUrl = process.env.AIRBNB_ICAL_URL;
    if (!iCalUrl || iCalUrl.includes('your_listing_id')) {
      // No calendar wired up yet — report everything as available.
      return res.json({ bookedDates: [], configured: false });
    }

    const response = await fetch(iCalUrl);
    const icsData = await response.text();

    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent');

    const bookedDates = [];
    events.forEach(event => {
      const dtstart = event.getFirstPropertyValue('dtstart');
      const dtend = event.getFirstPropertyValue('dtend');

      if (dtstart && dtend) {
        const startDate = dtstart.toJSDate ? dtstart.toJSDate() : dtstart;
        const endDate = dtend.toJSDate ? dtend.toJSDate() : dtend;

        const current = new Date(startDate);
        while (current < endDate) {
          bookedDates.push(current.toISOString().split('T')[0]);
          current.setDate(current.getDate() + 1);
        }
      }
    });

    const availability = {
      bookedDates: [...new Set(bookedDates)],
      configured: true,
      lastUpdated: new Date().toISOString()
    };

    availabilityCache.data = availability;
    availabilityCache.timestamp = Date.now();

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability', bookedDates: [], configured: false });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Villa Home booking server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Airbnb iCal: ${process.env.AIRBNB_ICAL_URL ? 'configured' : 'NOT configured (all dates shown available)'}`);
});
