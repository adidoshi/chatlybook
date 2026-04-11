import { Document, Types } from "mongoose";
import { UploadSchema } from "./lib/zod";
import { PLANS, PlanType } from "@/lib/subscription-constants";
import type { LucideIcon } from "lucide-react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { z } from "zod";

export interface BookCardProps {
  title: string;
  author: string;
  coverURL?: string;
  slug: string;
}

export type UploadFormInput = z.input<typeof UploadSchema>;
export type UploadFormValues = z.output<typeof UploadSchema>;

export interface FileUploadFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  acceptTypes: string[];
  disabled?: boolean;
  icon: LucideIcon;
  placeholder: string;
  hint: string;
}

export interface VoiceSelectorProps {
  disabled?: boolean;
  className?: string;
  value?: string;
  onChange: (voiceId: string) => void;
}

// ============================================
// DATABASE MODELS
// ============================================

export interface IBook extends Document {
  _id: string;
  clerkId: string;
  title: string;
  slug: string;
  author: string;
  persona?: string;
  fileURL: string;
  fileBlobKey: string;
  coverURL?: string;
  coverBlobKey?: string;
  fileSize: number;
  totalSegments: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookSegment extends Document {
  clerkId: string;
  bookId: Types.ObjectId;
  content: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVoiceSession extends Document {
  _id: string;
  clerkId: string;
  bookId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  billingPeriodStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBook {
  clerkId: string;
  title: string;
  author: string;
  persona?: string;
  fileURL: string;
  fileBlobKey: string;
  coverURL?: string;
  coverBlobKey?: string;
  fileSize: number;
}

export interface TextSegment {
  text: string;
  segmentIndex: number;
  pageNumber?: number;
  wordCount: number;
}

export interface Messages {
  role: string;
  content: string;
}

export interface SessionCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  plan: PlanType;
  maxDurationMinutes: number;
  error?: string;
}

export interface StartSessionResult {
  success: boolean;
  sessionId?: string;
  maxDurationMinutes?: number;
  error?: string;
  isBillingError?: boolean;
}

export interface EndSessionResult {
  success: boolean;
  error?: string;
}
