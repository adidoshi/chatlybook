"use server";

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import { auth } from "@clerk/nextjs/server";

export const getAllBooks = async () => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();
    const books = await Book.find({ clerkId: userId })
      .sort({ createdAt: -1 })
      .lean();
    return {
      success: true,
      data: serializeData(books),
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    return {
      success: false,
      error,
    };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const book = await Book.findOne({ clerkId: userId, slug }).lean();

    if (!book) {
      return { success: false, error: "Book not found" };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error fetching book by slug:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch book by slug",
    };
  }
};

export const checkBookExists = async (title: string) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { exists: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ clerkId: userId, slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (e) {
    console.error("Error checking book exists", e);
    return {
      exists: false,
      error: e instanceof Error ? e.message : "Failed to check if book exists",
    };
  }
};

export const createBook = async (data: CreateBook) => {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  const slug = generateSlug(data.title);

  try {
    await connectToDatabase();

    const existingBook = await Book.findOne({ slug, clerkId: userId }).lean();
    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    // Todo: Check subscription limits here before creating the book
    const book = await Book.create({
      ...data,
      clerkId: userId,
      slug,
      totalSegments: 0,
    });

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (e) {
    // Handle race conditions on unique owner+slug index as already-existing book.
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code?: number }).code === 11000
    ) {
      const existingBook = await Book.findOne({
        slug,
        clerkId: userId,
      }).lean();

      if (existingBook) {
        return {
          success: true,
          data: serializeData(existingBook),
          alreadyExists: true,
        };
      }
    }

    console.error("Error creating book:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create book",
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  segments: TextSegment[],
) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await connectToDatabase();

    const existingBook = await Book.findOne({ _id: bookId, clerkId: userId })
      .select("_id")
      .lean();

    if (!existingBook) {
      return {
        success: false,
        error: "Book not found or access denied",
      };
    }

    console.log("Saving book segments...");

    const segmentUpserts = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        updateOne: {
          filter: { bookId, segmentIndex },
          update: {
            $set: {
              clerkId: userId,
              content: text,
              pageNumber,
              wordCount,
            },
            $setOnInsert: {
              bookId,
              segmentIndex,
            },
          },
          upsert: true,
        },
      }),
    );

    const bulkWriteResult = await BookSegment.bulkWrite(segmentUpserts, {
      ordered: false,
    });

    await Book.findOneAndUpdate(
      { _id: bookId, clerkId: userId },
      { totalSegments: segments.length },
    );

    console.log("Book segments saved successfully.");

    return {
      success: true,
      data: {
        segmentsCreated: bulkWriteResult.upsertedCount,
        segmentsUpdated: bulkWriteResult.modifiedCount,
        totalProcessed: segments.length,
      },
    };
  } catch (error) {
    console.error("Error saving book segments:", error);

    // Avoid destructive cleanup for ordinary failures; keep existing data intact.
    // Rollbacks should only happen through an explicit, higher-level recovery path.
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save book segments",
    };
  }
};
