import mongoose from "mongoose";

const connectDB = async () => {
  const uri =
    process.env.MONGO_URL ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    "mongodb://127.0.0.1:27017/smitox";

  try {
    // Optional: quiet deprecation warnings
    mongoose.set("strictQuery", false);

    await mongoose.connect(uri);
    const { host, name } = mongoose.connection;
    // colors may be enabled in the project; guard in case it's not
    const msg = `MongoDB connected: ${host}/${name}`;
    console.log(typeof msg.green === "function" ? msg.green : msg);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Fail fast so container/platform restarts or logs clearly
    process.exit(1);
  }
};

export default connectDB;
