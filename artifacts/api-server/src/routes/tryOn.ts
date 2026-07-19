import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import OpenAI, { toFile, type Uploadable } from "openai";
import { db, tryOnJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { dailyIpRateLimit } from "../middlewares/dailyIpRateLimit";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function processTryOn(
  jobId: string,
  personPhotoBuffer: Buffer,
  personMimeType: string,
  clothingBuffers: { buffer: Buffer; mimetype: string }[],
) {
  try {
    await db
      .update(tryOnJobsTable)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(tryOnJobsTable.id, jobId));

    const prompt = `This is a virtual clothing try-on. The person in the first image should be shown wearing the clothing items from the other images. 
Keep the person's face, hair, skin tone, and body proportions exactly the same. 
Show the person wearing the new clothes in a clean, professional setting suitable for corporate attire.
The result should look realistic and natural, as if the person is actually wearing these clothes.
Show a full-body or 3/4 view of the person in the new outfit.`;

    // Build image inputs: person photo first, then clothing images
    const imageFiles: Uploadable[] = [];

    const personFile = await toFile(
      personPhotoBuffer,
      `person.${personMimeType.split("/")[1] || "jpg"}`,
      { type: personMimeType },
    );
    imageFiles.push(personFile);

    for (const cloth of clothingBuffers) {
      const ext = cloth.mimetype.split("/")[1] || "jpg";
      const clothFile = await toFile(cloth.buffer, `clothing.${ext}`, {
        type: cloth.mimetype,
      });
      imageFiles.push(clothFile);
    }

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
      prompt,
      size: "1024x1536",
      n: 1,
    });

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      throw new Error("No image returned from OpenAI");
    }

    const resultImageUrl = `data:image/png;base64,${imageData}`;

    await db
      .update(tryOnJobsTable)
      .set({ status: "completed", resultImageUrl, updatedAt: new Date() })
      .where(eq(tryOnJobsTable.id, jobId));

    logger.info({ jobId }, "Try-on job completed successfully");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Processing failed";
    logger.error({ jobId, err }, "Try-on job failed");

    await db
      .update(tryOnJobsTable)
      .set({ status: "failed", error: errorMsg, updatedAt: new Date() })
      .where(eq(tryOnJobsTable.id, jobId));
  }
}

// POST /api/try-on
router.post(
  "/try-on",
  dailyIpRateLimit,
  upload.fields([
    { name: "personPhoto", maxCount: 1 },
    { name: "clothingImages", maxCount: 8 },
  ]),
  async (req, res) => {
    const files = req.files as {
      personPhoto?: Express.Multer.File[];
      clothingImages?: Express.Multer.File[];
    };

    if (!files.personPhoto?.length) {
      res.status(400).json({ error: "Person photo is required" });
      return;
    }

    if (!files.clothingImages?.length) {
      res.status(400).json({ error: "At least one clothing image is required" });
      return;
    }

    const jobId = randomUUID();

    await db.insert(tryOnJobsTable).values({
      id: jobId,
      status: "pending",
    });

    const personFile = files.personPhoto[0];
    const clothingFiles = files.clothingImages.map((f) => ({
      buffer: f.buffer,
      mimetype: f.mimetype,
    }));

    // Process asynchronously — do not await
    processTryOn(
      jobId,
      personFile.buffer,
      personFile.mimetype,
      clothingFiles,
    ).catch((err) => logger.error({ jobId, err }, "Uncaught processTryOn error"));

    res.status(201).json({
      id: jobId,
      status: "pending",
      resultImageUrl: null,
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
);

// GET /api/try-on/:id
router.get("/try-on/:id", async (req, res) => {
  const { id } = req.params;

  const jobs = await db
    .select()
    .from(tryOnJobsTable)
    .where(eq(tryOnJobsTable.id, id))
    .limit(1);

  if (!jobs.length) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const job = jobs[0];
  res.json({
    id: job.id,
    status: job.status,
    resultImageUrl: job.resultImageUrl ?? null,
    error: job.error ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  });
});

export default router;
