import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";

async function seedTemplates() {
    const templatesDir = path.join(process.cwd(), "templates");

    const files = fs
        .readdirSync(templatesDir)
        .filter((f) => f.endsWith(".json"));

    if (files.length === 0) {
        console.log("No template JSON files found.");
        return;
    }

    const existingTemplates = await prisma.template.count();
    if (existingTemplates > 0) {
        console.log("Templates already seeded. Skipping.");
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

    for (const template of templates) {
        await prisma.template.create({
            data: {
                name: template.name,
                thumbnail: template.thumbnail,
                snapshot: template.snapshot,
            },
        });
    }

    console.log("Templates seeded successfully!");
}

seedTemplates()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });