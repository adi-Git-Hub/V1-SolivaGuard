const mongoose = require('mongoose');
const redisConnection = require('../config/redis');
const { queues } = require('../queues/queueManager');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendResponse = require('../utils/sendResponse');
const os = require('os');
const { isConfigured: isPhoneOtpConfigured } = require('../config/msg91');

/**
 * @desc    Public runtime feature flags for the frontend.
 * @route   GET /api/v1/system/config
 * @access  Public
 *
 * `phoneOtpEnabled` flips to true automatically once MSG91 credentials are set
 * and the backend restarts — the frontend reveals its Phone OTP affordances
 * only when this is true, so no frontend rebuild is needed to go live.
 */
exports.getPublicConfig = catchAsyncErrors(async (req, res, next) => {
  return sendResponse(res, {
    data: {
      phoneOtpEnabled: isPhoneOtpConfigured(),
    },
  });
});

/**
 * @desc    System Health Check
 * @route   GET /api/v1/system/health
 * @access  Public (or Admin protected depending on requirements)
 */
exports.getSystemHealth = catchAsyncErrors(async (req, res, next) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    memory: process.memoryUsage(),
    os: {
      loadavg: os.loadavg(),
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
    },
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'up' : 'down',
      redis: redisConnection.status === 'ready' ? 'up' : 'down',
    },
    queues: {},
  };

  // Get job counts for all queues (Only if Redis is ready)
  if (health.services.redis === 'up') {
    for (const queue of queues) {
      const counts = await queue.getJobCounts('wait', 'completed', 'failed', 'delayed', 'active');
      health.queues[queue.name] = counts;
    }
  }

  // Determine overall status
  if (health.services.mongodb !== 'up' || health.services.redis !== 'up') {
    health.status = 'DEGRADED';
  }

  return sendResponse(res, {
    success: true,
    data: health,
  });
});