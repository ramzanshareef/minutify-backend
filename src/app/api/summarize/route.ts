import { connectToDatabase } from "../../../../lib/database";
import { NextResponse } from "next/server";
import Meeting from "../../../../lib/models/meetings.model";
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

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
        const formData = await req.formData();
        const file = formData.get("audio");
        const userEmail = formData.get("userEmail");

        if (!file || !(file instanceof Blob) || !userEmail) {
            return setCorsHeaders(
                NextResponse.json({ status: 400, message: "Invalid input data" })
            );
        }

        const transcript = await convertAudioToText(file);
        if (!transcript) {
            return setCorsHeaders(
                NextResponse.json({ status: 500, message: "Failed to generate transcript" })
            );
        }

        const newMeeting = await Meeting.create({
            userEmail,
            transcript,
        });

        return setCorsHeaders(
            NextResponse.json({
                status: 200,
                transcript,
                meetingId: newMeeting._id.toString(),
            })
        );
    } catch (error: any) {
        return setCorsHeaders(
            NextResponse.json({ status: 500, message: error.message })
        );
    }
}

async function convertAudioToText(file: File): Promise<string> {
    const myfile = await ai.files.upload({
        file: file,
        config: { mimeType: "audio/mpeg" },
    });

    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
            createPartFromUri(myfile.uri as string, myfile.mimeType as string),
            "You are a professional transcriber. Please convert the provided audio to text..If it is already in english language, please return the text as it is. If it is in any other language, please translate it to English and then return the text.",
        ]),
    });
    if (result.text) {
        const translatedText = await translateToEnglish(result.text);
        return translatedText;
    } else {
        throw new Error("Failed to generate transcript");
    }
}

async function translateToEnglish(text: string): Promise<string> {
    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
            text,
            "Please translate the above text to English language, if it is not already in English. If it is already in English, please return the text as it is. Note: Please dont add any extra information or context to the text. Just return the text as it is.",
        ]),
    });
    if (result.text) {
        return result.text;
    } else {
        throw new Error("Failed to translate text to English");
    }
}