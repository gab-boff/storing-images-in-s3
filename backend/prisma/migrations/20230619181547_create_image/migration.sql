-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "imageName" TEXT NOT NULL,
    "caption" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
