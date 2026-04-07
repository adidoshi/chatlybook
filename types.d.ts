import { UploadSchema } from "./lib/zod";

export interface BookCardProps {
  title: string;
  author: string;
  coverURL: string;
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
