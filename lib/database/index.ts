"use server";

import { stdout } from "process";
import mongoose from "mongoose";
const DB_URL = process.env.DB_URL;

const connectDB = async () => {
    if (!mongoose.connections[0].readyState) {
        if (DB_URL) {
            await mongoose.connect(DB_URL).then(() => {
                stdout.write("MongoDB Connected at " + mongoose.connections[0].host);
            }).catch((err: Error) => {
                stdout.write("DB Connection Error = " + err.message);
            });
        }
        else {
            stdout.write("DB_URL not found, please add it to .env file.");
        }
    }
};

export { connectDB as connectToDatabase };