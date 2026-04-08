import { z } from "zod";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_PDF_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
} from "./constants";

const allowedVoiceIds = ["dave", "daniel", "chris", "rachel", "sarah"] as const;

export const UploadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(100, "Title must be less than 100 characters."),
  author: z
    .string()
    .trim()
    .min(1, "Author name is required.")
    .max(100, "Author name must be less than 100 characters."),
  persona: z
    .string()
    .refine(
      (value) =>
        allowedVoiceIds.includes(value as (typeof allowedVoiceIds)[number]),
      {
        message: "Please choose an assistant voice.",
      },
    ),
  pdfFile: z
    .custom<File | undefined>(
      (value) => value === undefined || value instanceof File,
    )
    .refine((file) => file instanceof File, {
      message: "Please upload a PDF file.",
    })
    .refine(
      (file) => file === undefined || ACCEPTED_PDF_TYPES.includes(file.type),
      {
        message: "Only PDF files are allowed.",
      },
    )
    .refine((file) => file === undefined || file.size <= MAX_FILE_SIZE, {
      message: "PDF must be 50MB or smaller.",
    }),
  coverImage: z
    .custom<File | undefined>(
      (value) => value === undefined || value instanceof File,
    )
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_IMAGE_SIZE,
      "Image size must be less than 10MB",
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported",
    ),
});
