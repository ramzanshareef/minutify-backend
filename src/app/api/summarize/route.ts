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
        const summary = await generateSummary(transcript);
        const actionItems = await getActionItems(transcript);
        if (!summary || !actionItems) {
            return setCorsHeaders(
                NextResponse.json({ status: 500, message: "Failed to generate summary or action items" })
            );
        }

        const newMeeting = await Meeting.create({
            userEmail,
            transcript,
            summary,
            actionItems,
        });

        return setCorsHeaders(
            NextResponse.json({
                status: 200,
                transcript,
                meetingId: newMeeting._id.toString(),
                summary,
                actionItems,
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
            "You are a professional transcriber. Please convert the provided audio to text.If it is already in English language, please return the text as it is. If it is in any other language, please translate it to English and then return the text.",
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
            "Please translate the above text to English language, if it is not already in English. If it is already in English, please return the text as it is. Note: Please don't add any extra information or context to the text. Just return the text as it is.",
        ]),
    });
    if (result.text) {
        return result.text;
    } else {
        throw new Error("Failed to translate text to English");
    }
}

async function generateSummary(transcript: string): Promise<string> {
    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
            transcript,
            "Please summarize the above text. Note: Please dont add any extra information or context to the text. Just return the summary as it is. Please generate such that we can understand the context of the meeting.",
        ]),
    });
    if (result.text) {
        return result.text;
    } else {
        throw new Error("Failed to generate summary");
    }
}

async function getActionItems(transcript: string): Promise<string> {
    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
            transcript,
            "Please extract the action items from the above text. Note: Please dont add any extra information or context to the text. Just return the action items as it is. Please return the action items in an array format like this: [item1, item2, item3]. If there are no action items, please return an array with one element 'No action items required'",
        ]),
    });
    if (result.text) {
        return JSON.parse(result.text);
    } else {
        throw new Error("Failed to generate action items");
    }
}