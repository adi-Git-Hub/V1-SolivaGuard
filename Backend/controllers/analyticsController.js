const AnalyticsEvent = require('../models/analyticsEventModel');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const { parseTrafficSource, parseUserAgent, getPseudonym } = require('../utils/analyticsHelper');

/**
 * @desc    Ingest first-party page view analytics event
 * @route   POST /api/v1/analytics/track
 * @access  Public (Optional auth via attachUserIfPresent)
 */
exports.trackEvent = catchAsyncErrors(async (req, res, next) => {
  const { visitorId, sessionId, path, title, referrer, utm, isSessionStart } = req.body;

  // Validation
  if (!visitorId || typeof visitorId !== 'string' || visitorId.length > 64) {
    return next(new ErrorHandler('Valid visitorId is required', 400));
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 64) {
    return next(new ErrorHandler('Valid sessionId is required', 400));
  }
  if (!path || typeof path !== 'string' || path.length > 256) {
    return next(new ErrorHandler('Valid path is required', 400));
  }

  // Sanitize path (strip query params and keep clean path)
  const cleanPath = path.split('?')[0].trim() || '/';

  // Parse User-Agent
  const uaHeader = req.headers['user-agent'] || '';
  const { deviceType, browser, os } = parseUserAgent(uaHeader);

  // Parse traffic source
  const safeReferrer = typeof referrer === 'string' ? referrer.slice(0, 512) : '';
  const trafficSource = parseTrafficSource(safeReferrer, utm);

  // Extract user if authenticated
  let userId = null;
  let userSnapshot = null;
  if (req.user) {
    userId = req.user._id;
    userSnapshot = {
      name: req.user.name || '',
      email: req.user.email || '',
    };
  }

  await AnalyticsEvent.create({
    visitorId: visitorId.trim(),
    sessionId: sessionId.trim(),
    userId,
    userSnapshot,
    path: cleanPath,
    title: typeof title === 'string' ? title.slice(0, 128) : '',
    referrer: safeReferrer,
    trafficSource,
    utm: {
      source: typeof utm?.source === 'string' ? utm.source.slice(0, 64) : '',
      medium: typeof utm?.medium === 'string' ? utm.medium.slice(0, 64) : '',
      campaign: typeof utm?.campaign === 'string' ? utm.campaign.slice(0, 64) : '',
      term: typeof utm?.term === 'string' ? utm.term.slice(0, 64) : '',
      content: typeof utm?.content === 'string' ? utm.content.slice(0, 64) : '',
    },
    deviceType,
    browser,
    os,
    isSessionStart: Boolean(isSessionStart),
    timestamp: new Date(),
  });

  return res.status(200).json({ success: true });
});

/**
 * @desc    Get website reach analytics metrics (page views, unique visitors, trend)
 * @route   GET /api/v1/admin/analytics/reach
 * @access  Private/Admin
 */
exports.getReachAnalytics = catchAsyncErrors(async (req, res, next) => {
  const { period = '7d', startDate, endDate } = req.query;

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let rangeStart;
  let rangeEnd = new Date();

  if (period === 'today') {
    rangeStart = startOfToday;
  } else if (period === '30d') {
    rangeStart = new Date(startOfToday.getTime() - 29 * 24 * 60 * 60 * 1000);
  } else if (period === 'custom' && startDate) {
    rangeStart = new Date(startDate);
    if (endDate) {
      rangeEnd = new Date(endDate);
      rangeEnd.setUTCHours(23, 59, 59, 999);
    }
  } else {
    // Default: '7d'
    rangeStart = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  }

  // 1. All-time Total Unique Visitors recorded
  const allTimeDistinct = await AnalyticsEvent.distinct('visitorId');
  const totalVisitors = allTimeDistinct.length;

  // 2. All-time Total Page Views recorded
  const allTimePageViews = await AnalyticsEvent.countDocuments({});

  // 3. Page Views in Range
  const rangePageViews = await AnalyticsEvent.countDocuments({
    timestamp: { $gte: rangeStart, $lte: rangeEnd },
  });
  const totalPageViews = period === 'all' || !req.query.period ? allTimePageViews : rangePageViews;

  // 4. Unique Visitors in Range
  const distinctVisitors = await AnalyticsEvent.distinct('visitorId', {
    timestamp: { $gte: rangeStart, $lte: rangeEnd },
  });
  const uniqueVisitors = distinctVisitors.length;

  // 5. Today's Distinct Visitors
  const todayDistinct = await AnalyticsEvent.distinct('visitorId', {
    timestamp: { $gte: startOfToday },
  });
  const todayVisitors = todayDistinct.length;

  // 4. Active Visitors in Last 30 Minutes
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const activeDistinct = await AnalyticsEvent.distinct('visitorId', {
    timestamp: { $gte: thirtyMinsAgo },
  });
  const activeVisitors = activeDistinct.length;

  // 5. Daily Traffic Trend
  const trendAgg = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        pageViews: { $sum: 1 },
        visitorsSet: { $addToSet: '$visitorId' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in zero days within the selected date range
  const trendMap = new Map();
  trendAgg.forEach((item) => {
    trendMap.set(item._id, {
      date: item._id,
      pageViews: item.pageViews,
      uniqueVisitors: item.visitorsSet ? item.visitorsSet.length : 0,
    });
  });

  const trafficTrend = [];
  const cur = new Date(rangeStart);
  // Cap max days to prevent unbounded loops on malformed custom range
  let maxDays = 90;
  while (cur <= rangeEnd && maxDays-- > 0) {
    const dStr = cur.toISOString().slice(0, 10);
    if (trendMap.has(dStr)) {
      trafficTrend.push(trendMap.get(dStr));
    } else {
      trafficTrend.push({ date: dStr, pageViews: 0, uniqueVisitors: 0 });
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  // 6. Top Pages Breakdown
  const topPagesAgg = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $group: {
        _id: '$path',
        views: { $sum: 1 },
        visitors: { $addToSet: '$visitorId' },
      },
    },
    {
      $project: {
        path: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$visitors' },
      },
    },
    { $sort: { views: -1 } },
    { $limit: 8 },
  ]);

  // 7. Traffic Sources Breakdown
  const sourcesAgg = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $group: {
        _id: '$trafficSource',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const trafficSources = sourcesAgg.map((s) => ({
    source: s._id,
    count: s.count,
    percentage: totalPageViews > 0 ? Math.round((s.count / totalPageViews) * 100) : 0,
  }));

  // 8. Device Breakdown
  const deviceAgg = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $group: {
        _id: '$deviceType',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const deviceBreakdown = deviceAgg.map((d) => ({
    device: d._id,
    count: d.count,
    percentage: totalPageViews > 0 ? Math.round((d.count / totalPageViews) * 100) : 0,
  }));

  return res.status(200).json({
    success: true,
    data: {
      period,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      totalVisitors,
      totalPageViews,
      uniqueVisitors,
      todayVisitors,
      activeVisitors,
      trafficTrend,
      topPages: topPagesAgg,
      trafficSources,
      deviceBreakdown,
    },
  });
});

/**
 * @desc    Get paginated and filtered visitor activity
 * @route   GET /api/v1/admin/analytics/visitors
 * @access  Private/Admin
 */
exports.getVisitorActivity = catchAsyncErrors(async (req, res, next) => {
  const {
    search = '',
    visitorType = 'all', // 'all' | 'user' | 'guest'
    trafficSource = 'all',
    deviceType = 'all',
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * pageLimit;

  // Build match filter
  const matchStage = {};

  if (startDate) {
    matchStage.timestamp = { $gte: new Date(startDate) };
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      matchStage.timestamp.$lte = endD;
    }
  }

  if (visitorType === 'user') {
    matchStage.userId = { $ne: null };
  } else if (visitorType === 'guest') {
    matchStage.userId = null;
  }

  if (trafficSource && trafficSource !== 'all') {
    matchStage.trafficSource = new RegExp(`^${trafficSource.trim()}$`, 'i');
  }

  if (deviceType && deviceType !== 'all') {
    matchStage.deviceType = new RegExp(`^${deviceType.trim()}$`, 'i');
  }

  // Aggregation pipeline grouping by visitorId
  const pipeline = [
    { $match: matchStage },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$visitorId',
        userId: { $first: '$userId' },
        userSnapshot: { $first: '$userSnapshot' },
        lastVisitedPage: { $first: '$path' },
        lastVisitTime: { $first: '$timestamp' },
        firstVisitTime: { $last: '$timestamp' },
        trafficSource: { $first: '$trafficSource' },
        deviceType: { $first: '$deviceType' },
        browser: { $first: '$browser' },
        os: { $first: '$os' },
        totalPageViews: { $sum: 1 },
      },
    },
  ];

  // Search filter applied after group
  if (search && search.trim()) {
    const sRegex = new RegExp(search.trim(), 'i');
    pipeline.push({
      $match: {
        $or: [
          { _id: sRegex },
          { lastVisitedPage: sRegex },
          { 'userSnapshot.name': sRegex },
          { 'userSnapshot.email': sRegex },
        ],
      },
    });
  }

  // Count total matching visitors
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await AnalyticsEvent.aggregate(countPipeline);
  const total = countResult[0] ? countResult[0].total : 0;

  // Sort and paginate
  pipeline.push({ $sort: { lastVisitTime: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: pageLimit });

  // Lookup fresh User details if logged in
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'userDetails',
    },
  });
  pipeline.push({
    $unwind: {
      path: '$userDetails',
      preserveNullAndEmptyArrays: true,
    },
  });

  const results = await AnalyticsEvent.aggregate(pipeline);

  const visitors = results.map((r) => {
    const isUser = Boolean(r.userId);
    const pseudonym = getPseudonym(r._id);
    const user = isUser
      ? {
          _id: r.userId,
          name: r.userDetails?.name || r.userSnapshot?.name || 'Registered User',
          email: r.userDetails?.email || r.userSnapshot?.email || '',
        }
      : null;

    return {
      visitorId: r._id,
      pseudonym,
      visitorType: isUser ? 'Logged-in User' : 'Guest',
      user,
      lastVisitedPage: r.lastVisitedPage,
      lastVisitTime: r.lastVisitTime,
      firstVisitTime: r.firstVisitTime,
      trafficSource: r.trafficSource,
      deviceType: r.deviceType,
      browser: r.browser,
      os: r.os,
      totalPageViews: r.totalPageViews,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      visitors,
      pagination: {
        page: pageNum,
        limit: pageLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageLimit)),
      },
    },
  });
});

/**
 * @desc    Get detailed activity timeline for a specific visitor
 * @route   GET /api/v1/admin/analytics/visitors/:visitorId
 * @access  Private/Admin
 */
exports.getVisitorDetail = catchAsyncErrors(async (req, res, next) => {
  const { visitorId } = req.params;

  if (!visitorId) {
    return next(new ErrorHandler('Visitor ID is required', 400));
  }

  const events = await AnalyticsEvent.find({ visitorId })
    .sort({ timestamp: -1 })
    .limit(50)
    .populate('userId', 'name email role')
    .lean();

  if (!events || events.length === 0) {
    return next(new ErrorHandler('Visitor activity not found', 404));
  }

  const latest = events[0];
  const isUser = Boolean(latest.userId);
  const pseudonym = getPseudonym(visitorId);

  const history = events.map((e) => ({
    _id: e._id,
    path: e.path,
    title: e.title,
    referrer: e.referrer,
    trafficSource: e.trafficSource,
    utm: e.utm,
    deviceType: e.deviceType,
    browser: e.browser,
    os: e.os,
    isSessionStart: e.isSessionStart,
    timestamp: e.timestamp,
  }));

  return res.status(200).json({
    success: true,
    data: {
      visitorId,
      pseudonym,
      visitorType: isUser ? 'Logged-in User' : 'Guest',
      user: isUser
        ? {
            _id: latest.userId._id,
            name: latest.userId.name || latest.userSnapshot?.name,
            email: latest.userId.email || latest.userSnapshot?.email,
          }
        : null,
      totalTrackedEvents: events.length,
      history,
    },
  });
});
