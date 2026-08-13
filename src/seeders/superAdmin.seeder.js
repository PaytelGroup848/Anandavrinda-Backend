require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const green = (t) => `\x1b[32m${t}\x1b[0m`;
const red = (t) => `\x1b[31m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const cyan = (t) => `\x1b[36m${t}\x1b[0m`;

async function seedSuperAdmin() {
  console.log(cyan("\n Super Admin Force Reset Seeder Starting...\n"));

  try {
    const MONGO_URI =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb+srv://datacloude8_db_user:6fD3ao7TUd3EgiPP@newqubanhc.d1c6qk4.mongodb.net/?appName=NewQubanHc";

    const SUPER_ADMIN_EMAIL = (
      process.env.SUPER_ADMIN_EMAIL || "superadmin@qubanhc.com"
    )
      .trim()
      .toLowerCase();

    const SUPER_ADMIN_PASSWORD =
      process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@12345";

    const SUPER_ADMIN_NAME =
      process.env.SUPER_ADMIN_NAME || "Super Admin";

    const SUPER_ADMIN_PHONE =
      process.env.SUPER_ADMIN_PHONE || "9999999999";

    await mongoose.connect(MONGO_URI);
    console.log(green("MongoDB Connected"));

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    const settingsCollection = db.collection("platformsettings");

    const now = new Date();

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    const payload = {
      name: SUPER_ADMIN_NAME,
      firstName: "Super",
      lastName: "Admin",
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,

      password: hashedPassword,

      role: "super_admin",
      status: "active",
      isActive: true,

      isEmailVerified: true,
      emailVerified: true,
      emailVerifiedAt: now,

      isPhoneVerified: true,
      phoneVerified: true,
      phoneVerifiedAt: now,

      permissions: [],

      failedLoginAttempts: 0,
      accountLockedUntil: null,
      passwordChangedAt: now,

      addresses: [],
      walletBalance: 0,

      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
      },

      avatar: {
        url: null,
        publicId: null,
      },

      lastLoginAt: null,
      lastLoginIp: null,

      updatedAt: now,
      __v: 0,
    };

    // Existing super admin email ya role se find karo
    const existingAdmin = await usersCollection.findOne({
      $or: [{ email: SUPER_ADMIN_EMAIL }, { role: "super_admin" }],
    });

    let adminId;

    if (existingAdmin) {
      await usersCollection.updateOne(
        { _id: existingAdmin._id },
        {
          $set: payload,
        }
      );

      adminId = existingAdmin._id;

      console.log(green(" Existing Super Admin force reset successfully"));
    } else {
      const result = await usersCollection.insertOne({
        ...payload,
        createdAt: now,
      });

      adminId = result.insertedId;

      console.log(green(" New Super Admin created successfully"));
    }

    // Duplicate super_admin remove mat karo, bas warn karo
    const superAdminCount = await usersCollection.countDocuments({
      role: "super_admin",
    });

    if (superAdminCount > 1) {
      console.log(
        yellow(` Warning: DB me ${superAdminCount} super_admin users hain.`)
      );
    }

    const existingSettings = await settingsCollection.findOne({
      key: "platform_settings",
    });

    if (!existingSettings) {
      await settingsCollection.insertOne({
        key: "platform_settings",

        store: {
          name: "My eCommerce Store",
          email: "",
          phone: "",
          currency: "INR",
          currencySymbol: "₹",
        },

        vendor: {
          isRegistrationEnabled: true,
          autoApprove: false,
          defaultCommissionRate: 10,
          minWithdrawalAmount: 500,
        },

        order: {
          freeShippingAbove: 999,
          defaultShippingCharge: 79,
          isCODEnabled: true,
          codCharge: 0,
          cancellationWindowHours: 24,
          returnWindowDays: 7,
        },

        tax: {
          isGSTEnabled: true,
          defaultGSTRate: 18,
          gstNumber: "",
        },

        updatedBy: adminId,
        createdAt: now,
        updatedAt: now,
      });

      console.log(green(" Platform settings created"));
    }

    console.log(green("\n Done!\n"));
    console.log(cyan("Login credentials:"));
    console.log(`Email    : ${SUPER_ADMIN_EMAIL}`);
    console.log(`Password : ${SUPER_ADMIN_PASSWORD}`);
    console.log(`Role     : super_admin`);
    console.log(yellow("\n Change password after first login!\n"));
  } catch (error) {
    console.log(red(`\n Seeder failed: ${error.message}\n`));
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(cyan("MongoDB connection closed\n"));
    process.exit(0);
  }
}

seedSuperAdmin();
