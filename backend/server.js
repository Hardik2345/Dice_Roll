const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const User = require("./models/User");
const FunnelEvent = require("./models/FunnelEvent");
const ShopifyService = require("./shopifyService");

const allowedOrigins = [
  "https://dice-roll-5wsv-git-localdev-hardiks-projects-4c8d6fa8.vercel.app",
];

const app = express();
const shopifyService = new ShopifyService();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("trust proxy", 1); // Trust first proxy (needed for secure cookies)

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // if using cookies or auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // explicitly allow these
  allowedHeaders: ["Content-Type", "Authorization"], // include any custom headers used
};

app.use(cors(corsOptions));

// Handle preflight requests
// app.options('*', cors());
app.options("/api/send-otp", cors(corsOptions));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dice-roll-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // required for cookies to be sent over HTTPS
      httpOnly: true,
      sameSite: "none", // required for cross-site cookies
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
    name: "dice-roll-session",
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dice-roll-app")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Hardcoded OTP for development
const HARDCODED_OTP = "123456";

// Discount code mappings (fallback for when Shopify is unavailable)
const DISCOUNT_CODES = {
  1: { code: "DICE10", discount: "10%" },
  2: { code: "DICE15", discount: "15%" },
  3: { code: "DICE20", discount: "20%" },
  4: { code: "DICE25", discount: "25%" },
  5: { code: "DICE30", discount: "30%" },
  6: { code: "DICE50", discount: "50%" },
};

// Helper function to hash mobile number
const hashMobile = async (mobile) => {
  return await bcrypt.hash(mobile, 10);
};

// Weighted dice roll function
function getWeightedDiceResult() {
  // Define probabilities for each face
  const probabilities = [
    { face: 1, weight: 50 }, // 50% chance (adjusted from 40% to make total 100%)
    { face: 2, weight: 18 }, // 18% chance
    { face: 3, weight: 20 }, // 20% chance
    { face: 4, weight: 5 }, // 5% chance
    { face: 5, weight: 5 }, // 5% chance
    { face: 6, weight: 2 }, // 2% chance
  ];

  // Calculate cumulative weights
  let cumulativeWeights = [];
  let totalWeight = 0;

  for (let i = 0; i < probabilities.length; i++) {
    totalWeight += probabilities[i].weight;
    cumulativeWeights.push({
      face: probabilities[i].face,
      cumWeight: totalWeight,
    });
  }

  // Generate random number between 0 and totalWeight
  const random = Math.random() * totalWeight;

  // Find which face to return based on the random number
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (random <= cumulativeWeights[i].cumWeight) {
      return cumulativeWeights[i].face;
    }
  }

  // Fallback (should never reach here)
  return 1;
}

// Routes

// Send OTP endpoint
app.post("/api/send-otp", async (req, res) => {
  try {
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ error: "Name and mobile number required" });
    }

    // Check if user has already played
    const existingUsers = await User.find({});
    for (let user of existingUsers) {
      const isMatch = await bcrypt.compare(mobile, user.mobileHash);
      if (isMatch) {
        return res.status(400).json({
          error: "You have already played this game!",
          alreadyPlayed: true,
        });
      }
    }

    // Store user info and OTP generation time in session
    req.session.userInfo = { name, mobile };
    req.session.generateOTPAt = new Date(); // Track OTP generation time
    req.session.playedAt = new Date(); // Track when user enters

    // In production, integrate with actual OTP service
    console.log(`OTP for ${mobile}: ${HARDCODED_OTP}`);

    // Log funnel event: entered
    await FunnelEvent.create({ mobile, name, eventType: "entered" });
    io.emit("funnelEventUpdate");
    // Log funnel event: otp_sent
    await FunnelEvent.create({ mobile, name, eventType: "otp_sent" });
    io.emit("funnelEventUpdate");

    res.json({
      success: true,
      message: "OTP sent successfully",
      debug: "Use OTP: 123456", // Remove in production
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP endpoint
app.post("/api/verify-otp", async (req, res) => {
  console.log("Verify OTP called with:", req.body);
  console.log("Session ID:", req.sessionID);
  console.log("User info in session:", req.session.userInfo);

  try {
    const { otp } = req.body;

    // const mobileHash = await hashMobile(mobile);

    // let user = await User.findOne({ mobileHash });

    if (!req.session.userInfo) {
      console.log("ERROR: No user info in session!");
      return res
        .status(400)
        .json({ error: "Session expired. Please start again." });
    }

    if (otp !== HARDCODED_OTP) {
      console.log(
        "ERROR: OTP mismatch!",
        "Received:",
        otp,
        "Expected:",
        HARDCODED_OTP
      );
      return res.status(400).json({ error: "Invalid OTP" });
    } else {
      // Mark session as verified
      req.session.verified = true;
      req.session.enteredOTPAt = new Date(); // Track OTP entered time
      console.log("SUCCESS: OTP verified!");
      // Log funnel event: otp_verified
      await FunnelEvent.create({
        mobile: req.session.userInfo.mobile,
        name: req.session.userInfo.name,
        eventType: "otp_verified",
      });
      io.emit("funnelEventUpdate");
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Roll dice endpoint - Updated with Shopify integration
app.post("/api/roll-dice", async (req, res) => {
  try {
    if (!req.session.verified || !req.session.userInfo) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Please verify OTP first." });
    }

    const { name, mobile } = req.session.userInfo;

    // Double-check if user has already played
    const existingUsers = await User.find({});
    for (let user of existingUsers) {
      const isMatch = await bcrypt.compare(mobile, user.mobileHash);
      if (isMatch) {
        return res.status(400).json({
          error: "You have already played this game!",
          alreadyPlayed: true,
        });
      }
    }

    // Generate weighted dice result (1-6)
    const diceResult = getWeightedDiceResult();

    // Create discount in Shopify
    let shopifyDiscount;
    let useShopify = true;

    try {
      shopifyDiscount = await shopifyService.createDiceRollDiscount(
        diceResult,
        name,
        mobile
      );
      console.log(
        "Shopify discount created successfully:",
        shopifyDiscount.code
      );
    } catch (shopifyError) {
      console.error("Shopify integration error:", shopifyError);
      useShopify = false;

      // Fallback to local discount code if Shopify fails
      const discountInfo = DISCOUNT_CODES[diceResult];
      shopifyDiscount = {
        code: `${discountInfo.code}_${mobile}`,
        percentage: parseInt(discountInfo.discount),
        priceRuleId: null,
        discountCodeId: null,
        shopifyUrl: null,
      };
    }

    // Hash mobile number for storage
    const mobileHash = await hashMobile(mobile);

    // Save user record with Shopify details
    let user = await User.findOne({ name, mobileHash });
    if (!user) {
      user = new User({
        mobileHash,
        name,
        discountCode: shopifyDiscount.code,
        diceResult,
        shopifyPriceRuleId: shopifyDiscount.priceRuleId,
        shopifyDiscountCodeId: shopifyDiscount.discountCodeId,
        isShopifyCode: useShopify,
        generateOTPAt: req.session.generateOTPAt,
        enteredOTPAt: req.session.enteredOTPAt,
        rollDiceAt: new Date(), // Track when dice is rolled
        playedAt: req.session.playedAt,
      });
      await user.save();
    } else {
      user.discountCode = shopifyDiscount.code;
      user.diceResult = diceResult;
      user.shopifyPriceRuleId = shopifyDiscount.priceRuleId;
      user.shopifyDiscountCodeId = shopifyDiscount.discountCodeId;
      user.isShopifyCode = useShopify;
      user.generateOTPAt = req.session.generateOTPAt;
      user.enteredOTPAt = req.session.enteredOTPAt;
      user.rollDiceAt = new Date();
      user.playedAt = req.session.playedAt;
      await user.save();
    }
    // Log funnel event: dice_rolled
    await FunnelEvent.create({
      mobile,
      name,
      eventType: "dice_rolled",
      userId: user._id,
    });
    io.emit("funnelEventUpdate");
    // Always update all funnel events for this mobile with the correct userId and name
    await FunnelEvent.updateMany({ mobile }, { userId: user._id, name });

    // Clear session
    req.session.destroy();

    res.json({
      success: true,
      diceResult,
      discountCode: shopifyDiscount.code,
      discount: `${shopifyDiscount.percentage}%`,
      shopifyUrl: shopifyDiscount.shopifyUrl,
      isShopifyCode: useShopify,
      message: `Congratulations! You won ${shopifyDiscount.percentage}% off!`,
    });
  } catch (error) {
    console.error("Roll dice error:", error);
    res.status(500).json({ error: "Failed to process dice roll" });
  }
});

// Mark discount as used endpoint
app.post("/api/mark-discount-used", async (req, res) => {
  try {
    const { discountCode } = req.body;
    if (!discountCode) {
      return res.status(400).json({ error: "Discount code required" });
    }
    const user = await User.findOne({ discountCode });
    if (!user) {
      return res.status(404).json({ error: "User not found for this code" });
    }
    user.discountUsedAt = new Date();
    await user.save();
    // Log funnel event: discount_used
    await FunnelEvent.create({
      mobile: user.mobileHash,
      name: user.name,
      eventType: "discount_used",
      userId: user._id,
    });
    io.emit("funnelEventUpdate");
    res.json({ success: true, message: "Discount usage recorded" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark discount as used" });
  }
});

// Check discount status
app.get("/api/discount-status/:code", async (req, res) => {
  try {
    const { code } = req.params;

    // First check if this is a Shopify code in our database
    const user = await User.findOne({ discountCode: code });

    if (!user || !user.isShopifyCode) {
      return res.json({
        code,
        valid: true,
        isShopifyCode: false,
        message: "This is a local discount code",
      });
    }

    // Check with Shopify
    const discount = await shopifyService.checkDiscountCode(code);

    if (!discount) {
      return res
        .status(404)
        .json({ error: "Discount code not found in Shopify" });
    }

    res.json({
      code: discount.code,
      usageCount: discount.usage_count,
      valid: discount.usage_count === 0,
      isShopifyCode: true,
    });
  } catch (error) {
    console.error("Check discount error:", error);
    res.status(500).json({ error: "Failed to check discount status" });
  }
});

// Status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    verified: req.session.verified || false,
    userInfo: req.session.userInfo || null,
  });
});

// Admin endpoint to get usage statistics
app.get("/api/admin/stats", async (req, res) => {
  try {
    // TODO: Add proper authentication here for admin access

    const totalUsers = await User.countDocuments();
    const shopifyUsers = await User.countDocuments({ isShopifyCode: true });
    const localUsers = await User.countDocuments({ isShopifyCode: false });

    const diceStats = await User.aggregate([
      {
        $group: {
          _id: "$diceResult",
          count: { $sum: 1 },
          shopifyCount: {
            $sum: { $cond: [{ $eq: ["$isShopifyCode", true] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const recentPlayers = await User.find()
      .sort({ playedAt: -1 })
      .limit(10)
      .select("name diceResult discountCode playedAt isShopifyCode");

    res.json({
      totalPlayers: totalUsers,
      shopifyDiscounts: shopifyUsers,
      localDiscounts: localUsers,
      diceDistribution: diceStats,
      recentPlayers,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

// Dashboard stats endpoint for admin
app.get("/api/admin/dashboard-stats", async (req, res) => {
  try {
    // TODO: Add authentication for admin access
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Adjust end date to include the whole day
    end.setHours(23, 59, 59, 999);

    // Helper to build query for each event
    const buildQuery = (field) => ({
      [field]: { $gte: start, $lte: end },
    });

    // Get counts and user lists for each event
    const [enteredUsers, verifiedUsers, rolledUsers, usedDiscountUsers] =
      await Promise.all([
        User.find(buildQuery("playedAt"))
          .select("name playedAt discountCode")
          .sort({ playedAt: -1 }),
        User.find(buildQuery("enteredOTPAt"))
          .select("name enteredOTPAt discountCode")
          .sort({ enteredOTPAt: -1 }),
        User.find(buildQuery("rollDiceAt"))
          .select("name rollDiceAt discountCode")
          .sort({ rollDiceAt: -1 }),
        User.find(buildQuery("discountUsedAt"))
          .select("name discountUsedAt discountCode")
          .sort({ discountUsedAt: -1 }),
      ]);

    res.json({
      entered: { count: enteredUsers.length, users: enteredUsers },
      verified: { count: verifiedUsers.length, users: verifiedUsers },
      rolled: { count: rolledUsers.length, users: rolledUsers },
      usedDiscount: {
        count: usedDiscountUsers.length,
        users: usedDiscountUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// Admin funnel stats endpoint with optional mobile search
app.get("/api/admin/funnel-stats", async (req, res) => {
  try {
    const { startDate, endDate, mobile } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ error: "startDate and endDate are required" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const eventTypes = [
      "entered",
      "otp_sent",
      "otp_verified",
      "dice_rolled",
      "discount_used",
    ];
    const stats = {};
    const mobileFilter = mobile
      ? { mobile: { $regex: mobile, $options: "i" } }
      : {};
    for (const eventType of eventTypes) {
      const events = await FunnelEvent.find({
        eventType,
        timestamp: { $gte: start, $lte: end },
        ...mobileFilter,
      }).sort({ timestamp: -1 });
      stats[eventType] = { count: events.length, events };
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch funnel stats" });
  }
});

// Test endpoint to verify dice distribution (REMOVE IN PRODUCTION)
app.get("/api/test-dice-distribution", (req, res) => {
  const iterations = parseInt(req.query.iterations) || 10000;
  const results = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (let i = 0; i < iterations; i++) {
    const result = getWeightedDiceResult();
    results[result]++;
  }

  const distribution = {};
  for (let face = 1; face <= 6; face++) {
    distribution[face] = {
      count: results[face],
      percentage: ((results[face] / iterations) * 100).toFixed(2) + "%",
      expected: {
        1: "50%",
        2: "18%",
        3: "20%",
        4: "5%",
        5: "5%",
        6: "2%",
      }[face],
    };
  }

  res.json({
    totalRolls: iterations,
    distribution,
    expectedAvgDiscount: "16.7%",
    note: "Remove this endpoint in production",
  });
});

// Cleanup old/unused discounts (run as a scheduled job)
app.post("/api/admin/cleanup-discounts", async (req, res) => {
  try {
    // TODO: Add proper authentication here for admin access

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldUsers = await User.find({
      playedAt: { $lt: thirtyDaysAgo },
      shopifyPriceRuleId: { $ne: null },
    });

    let deletedCount = 0;
    let errors = [];

    for (const user of oldUsers) {
      try {
        const deleted = await shopifyService.deleteDiscount(
          user.shopifyPriceRuleId
        );
        if (deleted) {
          deletedCount++;
          user.shopifyPriceRuleId = null;
          user.shopifyDiscountCodeId = null;
          await user.save();
        }
      } catch (error) {
        errors.push({ userId: user._id, error: error.message });
      }
    }

    res.json({
      message: `Cleaned up ${deletedCount} old discounts`,
      totalProcessed: oldUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ error: "Failed to cleanup discounts" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    // Check Shopify connection
    let shopifyStatus = "unknown";
    try {
      await shopifyService.makeRequest("/shop.json", "GET");
      shopifyStatus = "connected";
    } catch {
      shopifyStatus = "disconnected";
    }

    res.json({
      status: "ok",
      mongodb: mongoStatus,
      shopify: shopifyStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});

// Shopify webhook endpoint to mark discount as used
app.post("/api/shopify/webhook/discount-used", async (req, res) => {
  try {
    // Shopify sends the payload as JSON
    const { discount_code } = req.body;
    if (!discount_code) {
      return res
        .status(400)
        .json({ error: "Missing discount_code in webhook payload" });
    }
    // Find the user by discount code
    const user = await User.findOne({ discountCode: discount_code });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found for this discount code" });
    }
    user.discountUsedAt = new Date();
    await user.save();
    // Log funnel event: discount_used
    await FunnelEvent.create({
      mobile: user.mobileHash,
      name: user.name,
      eventType: "discount_used",
      userId: user._id,
    });
    io.emit("funnelEventUpdate");
    res.json({ success: true });
  } catch (error) {
    console.error("Shopify webhook error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Check if Shopify credentials are configured
  if (!process.env.SHOPIFY_STORE_URL || !process.env.SHOPIFY_ACCESS_TOKEN) {
    console.warn("⚠️  WARNING: Shopify credentials not found in .env file");
    console.warn(
      "⚠️  The app will work but will use local discount codes only"
    );
  } else {
    console.log("✅ Shopify integration configured");
  }
});
