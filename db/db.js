import mongoose from "mongoose";

export default function connectDB() {
    const MONGODB_URI = "mongodb://localhost:27017/Electroplating";

    if (!MONGODB_URI) {
        throw new Error("Please define MONGODB_URI in your environment variables.");
    }
    
    mongoose.connect(MONGODB_URI).then(() => console.log("Connected to DB"))
}