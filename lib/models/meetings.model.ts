import mongoose, { Document, models, Schema } from "mongoose";

export interface IMeeting extends Document {
    userEmail: string;
    transcript: string;
    summary: string;
    actionItems: string[];
}

const meetingSchema: Schema<IMeeting> = new Schema({
    userEmail: { type: String, required: true },
    transcript: { type: String, required: true },
    summary: { type: String, required: true },
    actionItems: { type: [String], required: true },
}, {
    timestamps: true
});

const Meeting = models.Meeting || mongoose.model<IMeeting>("Meeting", meetingSchema);

export default Meeting;