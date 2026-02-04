import "dotenv";
import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { configDotenv } from "dotenv";

configDotenv({
    path: path.resolve(process.cwd(), ".env.local"),
});

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const client = new ConvexHttpClient(CONVEX_URL);

async function seedTemplates() {
    const templatesDir = path.join(process.cwd(), "templates");

    const files = fs
        .readdirSync(templatesDir)
        .filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
        console.log("No template JSON files found.");
        return;
    }

    const templates = files.map((file) => {
        const raw = fs.readFileSync(
            path.join(templatesDir, file),
            "utf-8"
        );
        return JSON.parse(raw);
    });

    console.log(`Seeding ${templates.length} templates…`);

    const result = await client.mutation(api.templates.seedMany, {
        templates,
    });

    console.log(result);
}

seedTemplates().catch((err) => {
    console.error(err);
    process.exit(1);
});
