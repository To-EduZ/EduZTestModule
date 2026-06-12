import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/english-kids-app";

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
  isFallback: boolean;
}

// Extend the global object to store connection cache in development
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, isFallback: false };
}

export async function connectToDatabase(): Promise<{
  connection: mongoose.Connection | null;
  isFallback: boolean;
}> {
  if (cached!.conn) {
    return { connection: cached!.conn, isFallback: cached!.isFallback };
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 3000, // Timeout fast if MongoDB local isn't running
      maxPoolSize: 50, // Connection pool size limit for high concurrency scaling
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6 first to connect faster
    };

    console.log("🔌 Connecting to MongoDB local at:", MONGODB_URI);
    
    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ Successfully connected to MongoDB local");
        cached!.isFallback = false;
        return mongooseInstance.connection;
      })
      .catch((err) => {
        console.warn("⚠️ Could not connect to local MongoDB. Entering graceful fallback mode (in-memory mock store enabled).");
        console.warn("Details:", err.message);
        cached!.isFallback = true;
        // Return a mock connection structure so we don't throw uncaught exceptions
        return null as unknown as mongoose.Connection;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.isFallback = true;
    console.error("❌ Mongoose connection process threw an error:", e);
  }

  return { connection: cached!.conn, isFallback: cached!.isFallback };
}
