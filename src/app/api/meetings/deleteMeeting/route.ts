import { connectToDatabase } from "../../../../../lib/database";
import { NextRequest, NextResponse } from "next/server";
import Meeting from "../../../../../lib/models/meetings.model";

function setCorsHeaders(res: NextResponse) {
    res.headers.set("Access-Control-Allow-Origin", `chrome-extension://${process.env.EXTENSION_ID}`);
    res.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userEmail, meetingID } = body;
        if (!userEmail || !meetingID) {
            return setCorsHeaders(NextResponse.json({ status: 400, message: "Invalid input data" }));
        }
        let meeting = await Meeting.findOne({ _id: meetingID, userEmail });
        if (!meeting) {
            return setCorsHeaders(NextResponse.json({ status: 404, message: "Meeting not found" }));
        }
        await Meeting.deleteOne({ _id: meetingID, userEmail });
        return setCorsHeaders(NextResponse.json({ status: 200, message: "Meeting deleted successfully" }));
    } catch (error: Error | any) {
        return setCorsHeaders(NextResponse.json({ status: 500, message: error.message }));
    }
}