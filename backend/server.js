const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const axios = require("axios");
const http = require("http");
const MongoStore = require("connect-mongo");
const crypto=require("crypto")
const { Server } = require("socket.io");
require("dotenv").config();

const User = require("./models/User");
const FunnelEvent = require("./models/FunnelEvent");
const CustomerTag = require("./models/CustomerTag");
// const ShopifyService = require("./shopifyService");

const allowedOrigins = [
  "https://dice-roll-5wsv-git-localdev-hardiks-projects-4c8d6fa8.vercel.app",
  "https://dice-roll-git-admin-hardiks-projects-4c8d6fa8.vercel.app",
  "https://dice-roll-5wsv-git-admin-hardiks-projects-4c8d6fa8.vercel.app",
  "https://dice-roll-delta.vercel.app",
  "https://blabliblulife.com",
];

const app = express();
// const shopifyService = new ShopifyService();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
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
app.options("/api/verify-otp", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Support urlencoded bodies

const sessionStore = MongoStore.create({
  mongoUrl:
    process.env.MONGODB_URI || "mongodb://localhost:27017/dice-roll-app",
  collectionName: "sessions", // It's good practice to name the collection
  touchAfter: 24 * 3600, // 24 hours
});

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "dice-roll-secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // 30 minutes
  cookie: {
    secure: true, // required for cookies to be sent over HTTPS
    httpOnly: true,
    sameSite: "none", // required for cross-site cookies
    maxAge: 1000 * 60 * 30, // 30 minutes
  },
  name: "dice-roll-session",
  rolling: true,
});

app.use(sessionMiddleware);

// Initialize Passport.js for authentication
const passport = require('./config/passport');
const { requireAuth, requireAdmin } = require('./middleware/auth');
const Admin = require('./models/Admin');
app.use(passport.initialize());
app.use(passport.session());

// Admin authentication routes
app.post('/api/admin/login', (req, res, next) => {
  passport.authenticate('local', (err, admin, info) => {
    if (err) return res.status(500).json({ error: 'Authentication error' });
    if (!admin) return res.status(401).json({ error: info.message || 'Invalid credentials' });
    req.logIn(admin, (err) => {
      if (err) return res.status(500).json({ error: 'Login error' });
      return res.json({ success: true, admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin
      }});
    });
  })(req, res, next);
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout error' });
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Session destruction error' });
      res.json({ success: true });
    });
  });
});

app.get('/api/admin/status', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({ authenticated: true, admin: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    }});
  }
  return res.json({ authenticated: false });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/dice-roll-app")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Discount code mappings (fallback for when Shopify is unavailable)
const DISCOUNT_CODES = {
  1: { code: "DICE10", discount: "10%" },
  2: { code: "DICE15", discount: "15%" },
  3: { code: "DICE20", discount: "20%" },
  4: { code: "DICE25", discount: "25%" },
  5: { code: "DICE30", discount: "30%" },
  6: { code: "DICE100", discount: "100%" },
};

// Helper function to hash mobile number
const hashMobile = async (mobile) => {
  return await bcrypt.hash(mobile, 10);
};

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to generate random OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper function to send OTP via SMS gateway
async function sendOTPSMS(mobile, otp) {
  try {
    const otpMessage = `Your OTP for registration on our website https://blabliblulife.com is ${otp}. Do not share this code with anyone. Valid for 10 minutes only. - Team Bla Bli Blu Life`;

    const params = new URLSearchParams({
      user: "BBBLYF",
      password: "DYaha54h",
      senderid: "BBBLYF",
      channel: "Trans",
      DCS: "0",
      flashsms: "0",
      number: mobile,
      text: otpMessage,
      route: "15",
      DLTTemplateId: "1707175214642593740",
      PEID: "1701175126372816101",
    });

    const response = await axios.get(
      `http://alots.co.in/api/mt/SendSMS?${params.toString()}`
    );

    console.log("SMS API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("SMS sending error:", error);
    throw error;
  }
}

// Weighted dice roll function
function getWeightedDiceResult() {
  // Define probabilities for each face - 100% chance for 6
  const probabilities = [
    { face: 6, weight: 100 }, // 100% chance for face 6
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
  return 6;
}

// --- Shopify Admin API helpers (REST + GraphQL) ---
const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// 1. Search customer by phone (REST Admin API)
async function findShopifyCustomerByPhone(phone) {
  // Use phone as-is, no formatting
  try {
    const response = await axios.get(
      `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-07/customers/search.json`,
      {
        params: { query: `phone:${phone}` },
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    // Returns an array of customers (may be empty)
    return response.data.customers && response.data.customers.length > 0
      ? response.data.customers[0]
      : null;
  } catch (err) {
    console.error(
      "Shopify REST search error:",
      err.response ? err.response.data : err
    );
    throw err;
  }
}

// 2. Create customer (REST Admin API) - UPDATED TO ACCEPT EMAIL
async function createShopifyCustomer(phone, name, email) {
  let formattedPhone = phone;
  if (!/^\+91/.test(phone)) {
    formattedPhone = "+91" + phone.replace(/^\+?91/, "");
  }
  const payload = {
    customer: {
      phone: formattedPhone,
      email: email, // Use the provided email instead of generated one
      first_name: name,
    },
  };
  try {
    const response = await axios.post(
      `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-07/customers.json`,
      payload,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.customer;
  } catch (err) {
    console.error(
      "Shopify REST create error:",
      err.response ? err.response.data : err
    );
    throw err;
  }
}

// 3. Add tag to customer (REST Admin API) - CORRECTED LOGIC
async function addTagToShopifyCustomer(customerId, newTagsToAdd) {
  try {
    // 1. FETCH the customer to get their current tags
    const getCustomerResponse = await axios.get(
      `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-07/customers/${customerId}.json`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const currentTags = getCustomerResponse.data.customer.tags || "";
    // Split the string into an array, filter out any empty strings
    const existingTagsArray = currentTags.split(',').map(tag => tag.trim()).filter(Boolean);

    // 2. APPEND the new tags, avoiding duplicates
    const combinedTags = new Set([...existingTagsArray, ...newTagsToAdd]);
    const updatedTagsString = Array.from(combinedTags).join(', ');

    // 3. UPDATE the customer with the full list of tags
    const payload = {
      customer: {
        id: customerId,
        tags: updatedTagsString,
      },
    };

    const updateResponse = await axios.put(
      `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/2024-07/customers/${customerId}.json`,
      payload,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    return updateResponse.data.customer;

  } catch (err) {
    console.error(
      "Shopify REST tag update error:",
      err.response ? err.response.data : err
    );
    throw err;
  }
}

// Routes

// Send OTP endpoint (refactored for new Shopify logic) - UPDATED TO ACCEPT EMAIL
app.post("/api/send-otp", async (req, res) => {
  try {
    const { name, mobile, email } = req.body;

    if (!name || !mobile || !email) {
      return res
        .status(400)
        .json({ error: "Name, email and mobile number required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Shopify: Check if customer exists by phone
    let shopifyCustomer = await findShopifyCustomerByPhone(mobile);
    let hasRedeemedBefore = false;
    let tag;

    if (shopifyCustomer) {
      function getTagSet(raw) {
        const arr = Array.isArray(raw)
          ? raw
          : String(raw || '')
              .split(',')
              .map(t => t.trim())
              .filter(Boolean);
        // use lowercase for comparisons if you want case-insensitive logic
        return new Set(arr.map(t => t.toLowerCase()));
      }

      // usage:
      const tagsSet = getTagSet(shopifyCustomer.tags);
      const hasNoTag =
        !tagsSet.has('credited-once') &&
        !tagsSet.has('credited-twice') &&
        !tagsSet.has('credited-thrice');

      const hasExactlyOnce =
        tagsSet.has('credited-once') &&
        !tagsSet.has('credited-twice') &&
        !tagsSet.has('credited-thrice');

      const hasExactlyTwice =
        tagsSet.has('credited-twice') &&
        !tagsSet.has('credited-thrice');

      const hasExactlyThrice = tagsSet.has('credited-thrice');

      // Check if customer has redeemed tags but don't block them
      if (shopifyCustomer.tags && (shopifyCustomer.tags.includes("wallet-order-created") || hasExactlyOnce || hasExactlyTwice || hasExactlyThrice || hasNoTag)) {
        console.log("Customer has already redeemed before, but allowing to play");
        if(hasNoTag){
          hasRedeemedBefore = false;
          tag="credited-once"
        }
        if(hasExactlyOnce){
          hasRedeemedBefore = false; // Eligible for credit if they have redeemed exactly once
          tag="credited-twice"
        }
        if (hasExactlyTwice) {
          hasRedeemedBefore = false; // Eligible for credit if they have redeemed exactly twice
          tag="credited-thrice"
        }
        if(hasExactlyThrice){
          hasRedeemedBefore = true;
          console.log("Customer has already redeemed before, but allowing to play");
        }
      }
      // Store Shopify customerId in session (REST API returns numeric ID)
      req.session.shopifyCustomerId = shopifyCustomer.id;
    } else {
      // Customer does not exist, create with provided email
      const created = await createShopifyCustomer(mobile, name, email);
      req.session.shopifyCustomerId = created.id;
      req.session.marketPlace = true; // Set marketPlace to true for new customers
    }

    // Generate random OTP
    const otp = generateOTP();

    // Store user info (including email), OTP, OTP generation time, and redemption status in session
    req.session.userInfo = { name, mobile, email };
    req.session.otp = otp;
    req.session.generateOTPAt = new Date();
    req.session.playedAt = new Date();
    req.session.hasRedeemedBefore = hasRedeemedBefore;
    req.session.tag=tag

    // Send OTP via SMS gateway
    try {
      await sendOTPSMS(mobile, otp);
      console.log(`OTP sent to ${mobile}: ${otp}`);
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
      // You may want to decide whether to fail the request or continue
      // For now, we'll continue but log the error
    }

    // Log funnel event: entered
    await FunnelEvent.create({ mobile, name, eventType: "entered" });
    io.emit("funnelEventUpdate");
    // Log funnel event: otp_sent
    await FunnelEvent.create({ mobile, name, eventType: "otp_sent" });
    io.emit("funnelEventUpdate");

    res.json({
      success: true,
      message: "OTP sent successfully",
      // Remove debug OTP in production
      debug:
        process.env.NODE_ENV === "development" ? `Use OTP: ${otp}` : undefined,
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

    if (!req.session.userInfo) {
      console.log("ERROR: No user info in session!");
      return res
        .status(400)
        .json({ error: "Session expired. Please start again." });
    }

    if (!req.session.otp) {
      console.log("ERROR: No OTP in session!");
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new OTP." });
    }

    // Check if OTP is older than 10 minutes
    const otpAge = new Date() - new Date(req.session.generateOTPAt);
    const tenMinutes = 10 * 60 * 1000;
    if (otpAge > tenMinutes) {
      console.log("ERROR: OTP expired!");
      delete req.session.otp; // Clear expired OTP
      return res
        .status(400)
        .json({ error: "OTP expired. Please request a new OTP." });
    }

    if (otp !== req.session.otp) {
      console.log(
        "ERROR: OTP mismatch!",
        "Received:",
        otp,
        "Expected:",
        req.session.otp
      );
      return res.status(400).json({ error: "Invalid OTP" });
    } else {
      // Mark session as verified
      req.session.verified = true;
      req.session.enteredOTPAt = new Date(); // Track OTP entered time
      delete req.session.otp; // Clear OTP after successful verification
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

// Roll dice endpoint - Updated with Shopify integration and EMAIL FOR FLITS
app.post("/api/roll-dice", async (req, res) => {
  try {
    if (!req.session.verified || !req.session.userInfo) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Please verify OTP first." });
    }
    const { name, mobile, email } = req.session.userInfo;
    const shopifyCustomerId = req.session.shopifyCustomerId;
    const hasRedeemedBefore = req.session.hasRedeemedBefore || false;
    const marketPlace = req.session.marketPlace || false;
    const mobileHash=await hashMobile(mobile);
    const mobileIdentifier = sha256(mobile);

    // Generate weighted dice result (1-6)
    const diceResult = getWeightedDiceResult();
    // Create discount in Shopify (rest of the code remains the same)
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
    } catch (error) {
      console.error("Shopify integration error:", error);
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

    let user = null;

    // 2. First, try finding the user with the new, fast identifier
    user = await User.findOne({ mobileIdentifier });

    // 3. If not found, fall back to the legacy bcrypt check
    if (!user) {
      const potentialUsers = await User.find({ name });
      for (const potentialUser of potentialUsers) {
        const isMatch = await bcrypt.compare(mobile, potentialUser.mobileHash);
        if (isMatch) {
          user = potentialUser; // Found the user!

          // IMPORTANT: Upgrade the user's record on-the-fly
          user.mobileIdentifier = mobileIdentifier;
          // Note: We'll save this change in the 'else' block below.
          
          break;
        }
      }
    }
    if (!user) {
      user = new User({
        mobileHash,
        mobileIdentifier,
        name,
        email,
        discountCode: shopifyDiscount.code,
        diceResult,
        marketPlace,
        shopifyPriceRuleId: shopifyDiscount.priceRuleId,
        shopifyDiscountCodeId: shopifyDiscount.discountCodeId,
        isShopifyCode: useShopify,
        generateOTPAt: req.session.generateOTPAt,
        enteredOTPAt: req.session.enteredOTPAt,
        rollDiceAt: new Date(),
        playedAt: req.session.playedAt,
      });
      await user.save();
    } else {
      user.email = email;
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
      discountCode: user.discountCode,
    });
    io.emit("funnelEventUpdate");
    // Always update all funnel events for this mobile with the correct userId and name
    await FunnelEvent.updateMany({ mobile }, { userId: user._id, name });
    // Add the 'redeemed' tag to the Shopify customer (REST Admin API)
    if (shopifyCustomerId) {
      try {
        console.log("Adding 'redeemed' tag to Shopify customer");
        await addTagToShopifyCustomer(shopifyCustomerId, [req.session.tag]);
        console.log("Shopify customer tagged as redeemed");

       const redeemedWithin = async (mobileIdentifier, windowMs) => {
       const user = await User.findOne({ mobileIdentifier })
          .select('lastCreditAt')
          .lean();
          if (!user?.lastCreditAt) return false;
          return (Date.now() - new Date(user.lastCreditAt).getTime()) < windowMs;
       };

        const ONE_HOUR_MS = 60 * 60 * 1000;
        const redeemedWithinHour = await redeemedWithin(mobileIdentifier, ONE_HOUR_MS);
        // Only call Flits API if customer hasn't redeemed before
        if (!hasRedeemedBefore && !redeemedWithinHour) {
          console.log("Customer hasn't redeemed before, calling Flits API");
          // Use actual email for Flits integration
          const flits = {
            customer_email: email, // Use the actual email provided by user
            credit_details: {
              credit_value: 399,
              comment_text: `Rewarding the user 399 in his wallet`,
            },
          };

          const ress = await axios.post(
            "https://l7dwmnkv4xwd2wytgus6eajvbq0xtkli.lambda-url.us-east-2.on.aws/custom_action/HIzfFJcKqJL4UNOh2M5ZTA",
            flits,
            {
              headers: {
                "x-api-key": process.env.CUSTOM_ACTION_API_KEY,
              },
            }
          );
          await User.updateOne({ mobileIdentifier }, { $set: { lastCreditAt: new Date() } });
          console.log("Flits response recieved:", ress);
        } else {
          console.log("Customer has already redeemed before, skipping Flits API call");
        }
      } catch (err) {
        console.error("Failed to add redeemed tag to Shopify customer or call Flits API:", err);
      }
    }
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

app.post("/api/update-credit-time", async (req, res) => {
  try {
    const { mobileIdentifier } = req.body;
    console.log("Updating credit time for", mobileIdentifier);

    const user = await User.findOne({ mobileIdentifier });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.lastCreditAt = new Date();
    await user.save();

    res.json({ success: true, message: "Credit time updated" });
  } catch (error) {
    console.error("Failed to update credit time:", error);
    res.status(500).json({ error: "Failed to update credit time" });
  }
});

// Mark discount as used endpoint
app.post("/api/mark-discount-used", async (req, res) => {
  try {
    const { discountCode } = req.body;
    console.log("Discount code used", discountCode);
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
      discountCode: user.discountCode, // Add discountCode to event
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
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
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
app.get("/api/admin/dashboard-stats", requireAdmin, async (req, res) => {
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

// Admin funnel stats endpoint with full cache-busting headers
app.get(
  "/api/admin/funnel-stats",
  requireAdmin,
  (req, res, next) => {
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
  },
  async (req, res) => {
    try {
      const { startDate, endDate, mobile, eventType, page = "1", limit = "50" } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }
      if (!eventType) {
        return res.status(400).json({ error: "eventType is now required" });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const eventTypes = ["entered", "otp_sent", "otp_verified", "dice_rolled", "discount_used"]; 
      if (!eventTypes.includes(eventType)) {
        return res.status(400).json({ error: "Invalid eventType" });
      }

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const perPageRaw = parseInt(limit, 10) || 50;
      const perPage = Math.min(Math.max(perPageRaw, 1), 200);
      const skip = (pageNum - 1) * perPage;

      const match = { eventType, timestamp: { $gte: start, $lte: end } };
      if (mobile) match.mobile = { $regex: mobile, $options: "i" };

      const pipeline = [
        { $match: match },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
        { $addFields: {
            discountCode: { $cond: { if: { $gt: [{ $size: "$user" }, 0] }, then: { $arrayElemAt: ["$user.discountCode", 0] }, else: "$discountCode" } },
            unhashedMobile: { $cond: { if: { $gt: [{ $size: "$user" }, 0] }, then: { $arrayElemAt: ["$user.mobile", 0] }, else: null } }
          }
        },
        { $project: { user: 0 } },
        { $sort: { timestamp: -1 } },
        { $facet: { metadata: [{ $count: "total" }], events: [{ $skip: skip }, { $limit: perPage }] } }
      ];

      const agg = await FunnelEvent.aggregate(pipeline);
      const meta = agg[0].metadata[0] || { total: 0 };
      const total = meta.total;
      const totalPages = total === 0 ? 1 : Math.ceil(total / perPage);

      return res.json({
        eventType,
        count: total,
        page: pageNum,
        totalPages,
        limit: perPage,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
        events: agg[0].events
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch funnel stats" });
    }
  }
);

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
        1: "0%",
        2: "0%",
        3: "0%",
        4: "0%",
        5: "0%",
        6: "100%",
      }[face],
    };
  }

  res.json({
    totalRolls: iterations,
    distribution,
    expectedAvgDiscount: "100%",
    note: "Remove this endpoint in production",
  });
});

// Cleanup old/unused discounts (run as a scheduled job)
app.post("/api/admin/cleanup-discounts", requireAdmin, async (req, res) => {
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

// Add urlencoded middleware for Shopify webhooks to support both JSON and urlencoded payloads
app.use(
  "/api/shopify/webhook/discount-used",
  express.urlencoded({ extended: true })
);

// Shopify webhook endpoint to mark discount as used
app.post("/api/shopify/webhook/discount-used", async (req, res) => {
  try {
    // Debug: log the full body for troubleshooting
    // Shopify sends the payload as JSON (order object)
    const discountCodes = req.body.discount_codes;
    if (
      !discountCodes ||
      !Array.isArray(discountCodes) ||
      discountCodes.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "No discount codes found in webhook payload" });
    }
    let updated = 0;
    for (const codeObj of discountCodes) {
      const discount_code = codeObj.code;
      if (!discount_code) continue;
      // Find the user by discount code
      const user = await User.findOne({ discountCode: discount_code });
      if (!user) continue;
      user.discountUsedAt = new Date();
      await user.save();
      // Log funnel event: discount_used
      await FunnelEvent.create({
        mobile: user.mobileHash,
        name: user.name,
        eventType: "discount_used",
        userId: user._id,
        discountCode: user.discountCode, // Add discountCode to event
      });
      io.emit("funnelEventUpdate");
      updated++;
    }
    if (updated === 0) {
      return res
        .status(404)
        .json({ error: "No matching users for discount codes" });
    }
    res.json({ success: true, updated });
  } catch (error) {
    console.error("Shopify webhook error:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

// Shopify webhook endpoint to listen for customer tag additions
app.post("/api/shopify/webhook/customer-tag-added", async (req, res) => {
  try {
    // Log the incoming payload for debugging
    let { customerId, tags } = req.body;
    if (!customerId || !Array.isArray(tags)) {
      return res
        .status(400)
        .json({ error: "Missing customerId or tags array in payload" });
    }
    // Extract numeric Shopify customer ID if in gid://shopify/Customer/ format
    const match = customerId.match(/Customer\/(\d+)$/);
    if (match) {
      customerId = match[1];
    }
    // Fetch customer details from Shopify Admin API
    let phoneNumber = null;
    try {
      const shopifyUrl = `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2023-07/customers/${customerId}.json`;
      const response = await axios.get(shopifyUrl, {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
        },
      });
      if (
        response.data &&
        response.data.customer &&
        response.data.customer.phone
      ) {
        phoneNumber = response.data.customer.phone;
      }
    } catch (shopifyError) {
      console.error(
        "Error fetching customer from Shopify Admin API:",
        shopifyError.response ? shopifyError.response.data : shopifyError
      );
    }
    // Find existing record or create new
    let customerTag = await CustomerTag.findOne({ customerId });
    if (customerTag) {
      // Append new tags, avoiding duplicates
      const newTags = tags.filter((tag) => !customerTag.tags.includes(tag));
      if (newTags.length > 0) {
        customerTag.tags.push(...newTags);
      }
      if (phoneNumber) {
        customerTag.phoneNumber = phoneNumber;
      }
      await customerTag.save();
    } else {
      customerTag = new CustomerTag({ customerId, tags, phoneNumber });
      await customerTag.save();
    }
    // Check for 'redeemed' tag
    if (customerTag.tags.includes("redeemed")) {
      console.log(
        "Oops! it seems like you have already redeemed your discount coupon."
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Shopify customer tag webhook error:", error);
    res.status(500).json({ error: "Failed to process customer tag webhook" });
  }
});

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
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