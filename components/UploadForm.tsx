"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import LoadingOverlay from "./LoadingOverlay";
import { UploadSchema } from "@/lib/zod";
import { UploadFormInput, UploadFormValues } from "@/types";
import FileUploader from "./FileUploader";
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_PDF_TYPES } from "@/lib/constants";
import { Input } from "./ui/input";
import VoiceSelector from "./VoiceSelector";
import { useAuth } from "@clerk/react";
import { toast } from "sonner";
import {
  checkBookExists,
  createBook,
  saveBookSegments,
} from "@/lib/actions/book.actions";
import { useRouter } from "next/navigation";
import { parsePDFFile } from "@/lib/utils";
import { upload } from "@vercel/blob/client";

const UploadForm = () => {
  const router = useRouter();
  const { userId } = useAuth();
  const form = useForm<UploadFormInput, unknown, UploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "",
      pdfFile: undefined,
      coverImage: undefined,
    },
  });

  const onSubmit = async (values: UploadFormValues) => {
    if (!userId) {
      return toast.error("You must be signed in to upload a book.");
    }

    // PostHog -> Track book upload attempt

    try {
      const existsCheck = await checkBookExists(values.title);
      if (existsCheck.exists && existsCheck.book) {
        toast.info(
          "A book with this title already exists. Please choose a different title.",
        );
        form.reset();
        router.push(`/books/${existsCheck.book.slug}`);
        return;
      }

      const fileTitle = values.title.replace(/\s+/g, "-").toLowerCase();
      const pdfFile = values.pdfFile;

      if (!(pdfFile instanceof File)) {
        toast.error("Please upload a valid PDF file.");
        return;
      }

      const parsedPDF = await parsePDFFile(pdfFile);

      if (parsedPDF.content.length === 0) {
        toast.error(
          "The uploaded PDF is empty. Please upload a valid PDF file.",
        );
        return;
      }

      const uploadedPdfBlob = await upload(fileTitle, pdfFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "application/pdf",
      });

      let coverUrl: string;

      if (values.coverImage instanceof File) {
        const coverFile = values.coverImage;
        const uploadedCoverBlob = await upload(
          `${fileTitle}_cover.png`,
          coverFile,
          {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: coverFile.type,
          },
        );
        coverUrl = uploadedCoverBlob.url;
      } else {
        const response = await fetch(parsedPDF.cover);
        const coverBlob = await response.blob();
        const uploadedCoverBlob = await upload(
          `${fileTitle}_cover.png`,
          coverBlob,
          {
            access: "public",
            handleUploadUrl: "/api/upload",
            contentType: "image/png",
          },
        );
        coverUrl = uploadedCoverBlob.url;
      }

      const book = await createBook({
        clerkId: userId,
        title: values.title,
        author: values.author,
        persona: values.persona,
        fileURL: uploadedPdfBlob.url,
        fileBlobKey: uploadedPdfBlob.pathname,
        coverURL: coverUrl,
        fileSize: pdfFile.size,
      });

      if (!book.success) {
        const billingMessagePattern = /plan limit|upgrade your plan/i;
        const isBillingLimitError =
          book.isBillingError === true ||
          (typeof book.error === "string" &&
            billingMessagePattern.test(book.error));

        toast.error(book.error || "Book creation failed");

        if (isBillingLimitError) {
          router.push("/subscriptions");
        }

        return;
      }

      if (book.alreadyExists) {
        toast.info(
          "A book with this title already exists. Redirecting to the existing book.",
        );
        form.reset();
        router.push(`/books/${book.data.slug}`);
        return;
      }

      const segments = await saveBookSegments(book.data._id, parsedPDF.content);

      if (!segments.success) {
        toast.error(
          "Book was created but saving segments failed. Please contact support.",
        );
        throw new Error("Saving book segments failed");
      }

      form.reset();
      toast.success("Book uploaded successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error during book upload:", error);

      const fallbackMessage =
        "An error occurred while uploading the book. Please try again.";
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : fallbackMessage;
      const billingMessagePattern = /plan limit|upgrade your plan/i;

      toast.error(errorMessage);

      if (billingMessagePattern.test(errorMessage)) {
        router.push("/subscriptions");
      }
    }

    // Placeholder submit flow until backend upload/synthesis endpoints are wired.
    // await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("Upload payload ready", values);
  };

  return (
    <>
      {form.formState.isSubmitting ? <LoadingOverlay /> : null}
      <div className="new-book-wrapper">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. PDF File Upload */}
            <FileUploader
              control={form.control}
              name="pdfFile"
              label="Book PDF File"
              acceptTypes={ACCEPTED_PDF_TYPES}
              icon={Upload}
              placeholder="Click to upload PDF"
              hint="PDF file (max 50MB)"
              disabled={form.formState.isSubmitting}
            />

            {/* 2. Cover Image Upload */}
            <FileUploader
              control={form.control}
              name="coverImage"
              label="Cover Image (Optional)"
              acceptTypes={ACCEPTED_IMAGE_TYPES}
              icon={ImageIcon}
              placeholder="Click to upload cover image"
              hint="Leave empty to auto-generate from PDF"
              disabled={form.formState.isSubmitting}
            />

            {/* 3. Title Input */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Title</FormLabel>
                  <FormControl>
                    <Input
                      className="form-input"
                      placeholder="ex: Rich Dad Poor Dad"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Author Input */}
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">Author Name</FormLabel>
                  <FormControl>
                    <Input
                      className="form-input"
                      placeholder="ex: Robert Kiyosaki"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Voice Selector */}
            <FormField
              control={form.control}
              name="persona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="form-label">
                    Choose Assistant Voice
                  </FormLabel>
                  <FormControl>
                    <VoiceSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Submit Button */}
            <Button
              type="submit"
              className="form-btn"
              disabled={form.formState.isSubmitting}
            >
              Begin Synthesis
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};

export default UploadForm;
