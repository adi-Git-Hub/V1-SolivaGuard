const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    userSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    path: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    referrer: {
      type: String,
      trim: true,
      default: '',
    },
    trafficSource: {
      type: String,
      enum: [
        'Direct',
        'Google / Organic Search',
        'Instagram',
        'Facebook',
        'Meta Ads / Campaign',
        'Other Referrals',
      ],
      default: 'Direct',
      index: true,
    },
    utm: {
      source: { type: String, trim: true, default: '' },
      medium: { type: String, trim: true, default: '' },
      campaign: { type: String, trim: true, default: '' },
      term: { type: String, trim: true, default: '' },
      content: { type: String, trim: true, default: '' },
    },
    deviceType: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
      default: 'Desktop',
      index: true,
    },
    browser: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    os: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    isSessionStart: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// High-performance compound indexes for date range and visitor queries
analyticsEventSchema.index({ timestamp: -1 });
analyticsEventSchema.index({ visitorId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ trafficSource: 1, timestamp: -1 });
analyticsEventSchema.index({ deviceType: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
