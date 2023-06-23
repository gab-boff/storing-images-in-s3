import express from "express";

import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import crypto from "crypto";
import sharp from "sharp";

import { PrismaClient } from "@prisma/client";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

const app = express();
const port = 8000;

app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const randomImageName = () => crypto.randomBytes(32).toString("hex");

const prisma = new PrismaClient();

app.get("/api/images", async (req, res) => {
  const images = await prisma.Image.findMany({ orderBy: { created: "desc" } });

  for (const image of images) {
    const params = {
      Bucket: bucketName,
      Key: image.imageName,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    image.imageUrl = url;
  }

  res.send(images);
});

app.post("/api/images", upload.single("image"), async (req, res) => {
  console.log("req.body", req.body);
  console.log("req.file", req.file);

  const buffer = await sharp(req.file.buffer)
    .resize({ width: 512, height: 512, fit: "contain" })
    .toBuffer();

  const imageName = randomImageName();

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Body: buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);

  await s3Client.send(command);

  const image = await prisma.Image.create({
    data: {
      imageName: imageName,
      caption: req.body.caption,
    },
  });

  res.send(image);
});

app.delete("/api/images/:id", async (req, res) => {
  const id = +req.params.id;

  const image = await prisma.Image.findUnique({ where: { id: id } });

  if (!image) {
    res.status(404).send({ message: "Image not found" });
    return;
  }

  const params = {
    Bucket: bucketName,
    Key: image.imageName,
  };

  const command = new DeleteObjectCommand(params);
  await s3Client.send(command);

  await prisma.Image.delete({ where: { id: id } });

  res.send({ message: "Image deleted" });
});

app.listen(port, () => {
  console.log(`Server - listening on port ${port}`);
});
