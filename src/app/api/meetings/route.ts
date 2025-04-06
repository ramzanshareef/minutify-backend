import { connectToDatabase } from "../../../../lib/database";
import Meeting, { IMeeting } from "../../../../lib/models/meetings.model";
import { NextResponse } from "next/server";

function setCorsHeaders(res: NextResponse) {
    res.headers.set("Access-Control-Allow-Origin", `chrome-extension://${process.env.EXTENSION_ID}`);
    res.headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { userEmail } = body;
        if (!userEmail) {
            return setCorsHeaders(NextResponse.json({ status: 400, message: "Invalid input data" }));
        }
        const meetings: IMeeting[] | [] = await Meeting.find({ userEmail }).sort({ createdAt: -1 });
        return setCorsHeaders(NextResponse.json({ status: 200, meetings: JSON.parse(JSON.stringify(meetings)) }));
    } catch (error: any) {
        return setCorsHeaders(NextResponse.json({ status: 500, message: error.message }));
    }
}