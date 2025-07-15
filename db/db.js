import mongoose from "mongoose";

export default function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error("Please define MONGODB_URI in your environment variables.");
    }
    
    mongoose.connect(MONGODB_URI).then(() => console.log("Connected to DB"))
}
