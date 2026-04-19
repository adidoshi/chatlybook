import { IBook } from "@/types";
import { Schema, models, model } from "mongoose";

type MongoIndex = {
  key?: Record<string, unknown>;
  name?: string;
  unique?: boolean;
};

const BookSchema = new Schema<IBook>(
  {
    clerkId: { type: String, required: true },
    title: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    author: { type: String, required: true },
    persona: { type: String },
    fileURL: { type: String, required: true },
    fileBlobKey: { type: String, required: true },
    coverURL: { type: String },
    coverBlobKey: { type: String },
    fileSize: { type: Number, required: true },
    totalSegments: { type: Number, default: 0 },
  },
  { timestamps: true },
);

BookSchema.index({ clerkId: 1, slug: 1 }, { unique: true });

const Book = models.Book || model<IBook>("Book", BookSchema);

let ensuredBookIndexesPromise: Promise<void> | null = null;

const isLegacySlugIndex = (index: MongoIndex) => {
  if (!index.unique || !index.key) {
    return false;
  }

  const keys = Object.entries(index.key);
  return keys.length === 1 && keys[0]?.[0] === "slug" && keys[0]?.[1] === 1;
};

const hasOwnerSlugIndex = (index: MongoIndex) => {
  if (!index.unique || !index.key) {
    return false;
  }

  return index.key.clerkId === 1 && index.key.slug === 1;
};

export const ensureBookIndexes = async () => {
  if (!ensuredBookIndexesPromise) {
    ensuredBookIndexesPromise = (async () => {
      const indexes: MongoIndex[] = await Book.collection
        .indexes()
        .then((items) =>
          items.map((item) => ({
            key: item.key as Record<string, unknown> | undefined,
            name: item.name,
            unique: item.unique,
          })),
        )
        .catch((error: unknown): MongoIndex[] => {
          const codeName =
            typeof error === "object" &&
            error !== null &&
            "codeName" in error &&
            typeof (error as { codeName?: unknown }).codeName === "string"
              ? (error as { codeName: string }).codeName
              : undefined;

          if (codeName === "NamespaceNotFound") {
            return [];
          }

          throw error;
        });
      const legacySlugIndex = indexes.find(isLegacySlugIndex);

      if (legacySlugIndex?.name) {
        await Book.collection.dropIndex(legacySlugIndex.name).catch((error) => {
          const codeName =
            typeof error === "object" &&
            error !== null &&
            "codeName" in error &&
            typeof (error as { codeName?: unknown }).codeName === "string"
              ? (error as { codeName: string }).codeName
              : undefined;

          if (codeName === "IndexNotFound") {
            return;
          }

          throw error;
        });
      }

      if (!indexes.some(hasOwnerSlugIndex)) {
        await Book.collection.createIndex(
          { clerkId: 1, slug: 1 },
          { unique: true, name: "clerkId_1_slug_1" },
        );
      }
    })().catch((error) => {
      ensuredBookIndexesPromise = null;
      throw error;
    });
  }

  return ensuredBookIndexesPromise;
};

export default Book;
