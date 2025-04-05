import mongoose, { Document, models, Schema } from "mongoose";

export interface IMeeting extends Document {
    userEmail: string;
    transcript: string;
    summary: string;
    actionItems: string[];
}

const meetingSchema: Schema<IMeeting> = new Schema({
    userEmail: { type: String, required: true },
    transcript: { type: String, required: true, default: "No Transcript Provided" },
    summary: { type: String, required: true, default: "No Summary Generated" },
    actionItems: { type: [String], default: [] }
}, {
    timestamps: true
});

const Meeting = models.Meeting || mongoose.model<IMeeting>("Meeting", meetingSchema);

export default Meeting;