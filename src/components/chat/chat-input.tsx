import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { env } from "@/env";
import { useAuth } from "@clerk/nextjs";
import type { Attachment } from "ai";
import {
  ArrowUpIcon,
  FileText,
  Loader2Icon,
  LoaderCircleIcon,
  Paperclip,
  SquareIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useChat } from "./chat-provider";
import { ProvidersSelect } from "./providers-select";

// File upload constraints
const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

export function ChatInput() {
  const {
    selectedModel,
    setSelectedModel,
    setAttachments,
    handleValueChange,
    input,
    status,
    stop,
    messages,
    handleStartChat,
    handleChatInterfaceSend,
  } = useChat();
  const { isSignedIn } = useAuth();
  const [files, setFiles] = useState<
    Array<{
      id: string;
      file: File;
      uploading: boolean;
      progress: number;
      key?: string;
      isDeleting: boolean;
      error: boolean;
      objectUrl?: string;
    }>
  >([]);

  const handleStartChateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleStartChat();
      }
    },
    [handleStartChat],
  );

  const handleChatInterfaceKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleChatInterfaceSend();
      }
    },
    [handleChatInterfaceSend],
  );

  const handleSend =
    messages.length > 0 ? handleChatInterfaceSend : handleStartChat;

  const handleKeyDown =
    messages.length > 0 ? handleChatInterfaceKeyDown : handleStartChateKeyDown;

  const updateAttachments = useCallback(() => {
    const successfulUploads = files.filter(
      (file) => file.progress === 100 && !file.error && file.key,
    );

    const attachments = successfulUploads.map((file) => ({
      name: file.file.name,
      contentType: file.file.type,
      url: `${env.AWS_BUCKET_URL}/${file.key}`,
    }));

    setAttachments(attachments);
  }, [files, setAttachments, env]);

  const uploadFile = useCallback(
    async (file: File) => {
      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.file === file ? { ...f, uploading: true } : f)),
      );

      try {
        const presignedUrlResponse = await fetch("/api/s3/upload", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!presignedUrlResponse.ok) {
          toast.error("Failed to upload file. please try again later.");

          setFiles((prevFiles) =>
            prevFiles.map((f) =>
              f.file === file
                ? { ...f, uploading: false, progress: 0, error: true }
                : f,
            ),
          );

          return;
        }

        const { presignedUrl, key } = await presignedUrlResponse.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentageCompleted = Math.round(
                (event.loaded / event.total) * 100,
              );
              setFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.file === file
                    ? { ...f, progress: percentageCompleted, key }
                    : f,
                ),
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              setFiles((prevFiles) =>
                prevFiles.map((f) =>
                  f.file === file
                    ? {
                        ...f,
                        uploading: false,
                        progress: 100,
                        key,
                        error: false,
                      }
                    : f,
                ),
              );

              toast.success("File uploaded successfully");

              setTimeout(() => {
                updateAttachments();
              }, 100); // Small delay to ensure state is updated

              resolve();
            } else {
              reject(new Error(`Upload Failed with status: ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Upload Failed"));
          };

          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      } catch (error) {
        toast.error("Failed to upload file");

        setFiles((prevFiles) =>
          prevFiles.map((f) =>
            f.file === file
              ? { ...f, uploading: false, progress: 0, error: true }
              : f,
          ),
        );
      }
    },
    [updateAttachments],
  );

  const validateFiles = useCallback(
    (filesToValidate: File[]) => {
      const errors: string[] = [];

      // Check if user is signed in
      if (!isSignedIn) {
        toast.error("Please sign in to upload files");
        return false;
      }

      // Check total number of files
      if (files.length + filesToValidate.length > MAX_FILES) {
        const remainingSlots = MAX_FILES - files.length;
        if (remainingSlots <= 0) {
          toast.error(`Maximum ${MAX_FILES} files allowed`);
          return false;
        } else {
          toast.error(
            `You can only add ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"}`,
          );
          return false;
        }
      }

      // Validate each file
      for (const file of filesToValidate) {
        // Check file type
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          const extension = "." + file.name.split(".").pop()?.toLowerCase();
          if (!ACCEPTED_EXTENSIONS.includes(extension)) {
            errors.push(
              `${file.name}: Only images (JPG, PNG) and PDF files are allowed`,
            );
            continue;
          }
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          errors.push(
            `${file.name}: File size (${fileSizeMB}MB) exceeds 5MB limit`,
          );
        }
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
        return false;
      }

      return true;
    },
    [files.length, isSignedIn],
  );

  const handleFilesAdded = useCallback(
    (acceptedFiles: File[]) => {
      if (!validateFiles(acceptedFiles)) {
        return;
      }

      if (acceptedFiles.length > 0) {
        setFiles((prevFiles) => [
          ...prevFiles,
          ...acceptedFiles.map((file) => ({
            id: uuidv4(),
            file: file,
            uploading: false,
            progress: 0,
            isDeleting: false,
            error: false,
            objectUrl: URL.createObjectURL(file),
          })),
        ]);
      }

      acceptedFiles.forEach(uploadFile);
    },
    [validateFiles, uploadFile],
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      const fileToRemove = files.find((file) => file.id === fileId);

      if (fileToRemove) {
        if (fileToRemove.objectUrl) {
          URL.revokeObjectURL(fileToRemove.objectUrl);
        }
      }

      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, isDeleting: true } : file,
        ),
      );

      try {
        const deleteFileResponse = await fetch(`/api/s3/delete`, {
          method: "DELETE",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            key: fileToRemove?.key,
          }),
        });

        if (!deleteFileResponse.ok) {
          toast.error("Failed to delete file");

          setFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.id === fileId
                ? { ...file, isDeleting: false, error: true }
                : file,
            ),
          );

          return;
        }

        toast.success("File deleted successfully");

        setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));

        // Update attachments after file removal
        setTimeout(() => {
          updateAttachments();
        }, 100);
      } catch (error) {
        toast.error("Failed to delete file");

        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.id === fileId
              ? { ...file, isDeleting: false, error: true }
              : file,
          ),
        );
      }
    },
    [files, updateAttachments],
  );

  const fileStates = {
    hasFiles: files.length > 0,
    uploading: files.some((file) => file.uploading),
    deleting: files.some((file) => file.isDeleting),
    hasErrors: files.some((file) => file.error),
    allUploaded:
      files.length > 0
        ? files.every((file) => file.progress === 100 && !file.error)
        : true,
    someIncomplete: files.some(
      (file) => file.progress < 100 && !file.error && !file.uploading,
    ),
    atMaxFiles: files.length >= MAX_FILES,
  };

  const isDisabled =
    !input.trim() ||
    status === "submitted" ||
    fileStates.uploading ||
    fileStates.deleting ||
    fileStates.hasErrors ||
    (fileStates.hasFiles && !fileStates.allUploaded) ||
    !isSignedIn;

  const isInteractive = status === "ready" || status === "error";

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (!isDisabled) {
      if (!isSignedIn) {
        toast.error("Please sign in to send a message");
        return;
      }
      handleSend(e);

      if (files.length > 0) {
        setFiles([]);
      }
    }
  };

  // Generate tooltip content for file upload
  const getFileUploadTooltip = () => {
    if (!isSignedIn) {
      return "Please sign in to upload files";
    }
    if (fileStates.atMaxFiles) {
      return `Maximum ${MAX_FILES} files reached`;
    }
    return `Upload images (JPG, PNG) or PDFs only. Maximum ${MAX_FILES} files, 5MB each.`;
  };

  return (
    <FileUpload
      onFilesAdded={handleFilesAdded}
      multiple={true}
      accept={ACCEPTED_FILE_TYPES.join(",")}
    >
      <PromptInput
        value={input}
        onValueChange={handleValueChange}
        isLoading={status === "streaming"}
        onSubmit={handleSubmit}
        className="w-full max-w-3xl mx-auto bg-muted/50"
      >
        {files.length > 0 && (
          <ScrollArea className="w-full overflow-x-auto">
            <div className="flex items-center gap-2 p-1 w-max">
              {files.map((file) => (
                <AnimatePresence mode="wait" key={file.id}>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.5,
                      type: "tween",
                    }}
                    className="bg-muted/50 border border-muted  w-[200px] shrink-0 flex  items-center justify-between gap-2 rounded-xl px-2 py-2 text-sm shadow-md"
                  >
                    <div className="flex items-center gap-2 w-full  ">
                      {file.file.type.startsWith("image") ? (
                        <Image
                          src={file.objectUrl as string}
                          alt={file.file.name}
                          width={50}
                          height={50}
                          className="rounded-lg w-10 h-10 object-cover aspect-square"
                        />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted">
                          <FileText className="size-6" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="max-w-[100px] text-sm truncate">
                          {file.file.name}
                        </span>
                        <span className="text-xs">
                          {file.uploading ? (
                            `${file.progress}% uploaded`
                          ) : (
                            <>
                              {file.error === true ? (
                                <span className="text-destructive">
                                  Error uploading file
                                </span>
                              ) : (
                                <>
                                  {file.progress === 100 ? (
                                    <span className="text-green-500">
                                      Ready
                                    </span>
                                  ) : (
                                    `${file.progress}% uploaded`
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      disabled={
                        file.isDeleting === true ||
                        file.uploading === true ||
                        status === "error" ||
                        status === "submitted"
                      }
                      className="hover:bg-muted rounded-lg p-1"
                    >
                      {file.isDeleting ? (
                        <LoaderCircleIcon className="animate-spin size-4" />
                      ) : (
                        <X className="size-4" />
                      )}
                    </button>
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        <PromptInputTextarea
          onKeyDown={handleKeyDown}
          disabled={!isInteractive}
          className="bg-transparent"
          placeholder="How can I help you today..."
        />

        <PromptInputActions className="flex items-center justify-between  pt-2">
          <PromptInputAction tooltip={getFileUploadTooltip()}>
            <FileUploadTrigger asChild>
              <Button
                disabled={!isSignedIn || fileStates.atMaxFiles}
                size="icon"
                variant="outline"
                className="rounded-lg"
              >
                <Paperclip className=" size-5" />
              </Button>
            </FileUploadTrigger>
          </PromptInputAction>

          <div className="flex items-center gap-2">
            <PromptInputAction tooltip={"Select Model"}>
              <ProvidersSelect
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
              />
            </PromptInputAction>
            <PromptInputAction
              tooltip={
                !isSignedIn
                  ? "Please sign in to send a message"
                  : status === "submitted"
                    ? "Submitting..."
                    : status === "streaming"
                      ? "Stop generating"
                      : status === "error"
                        ? "Fix errors and try again"
                        : "Send message"
              }
            >
              <Button
                variant={status === "error" ? "destructive" : "default"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => {
                  if (status === "streaming") {
                    stop();
                    return;
                  }

                  if (
                    (status === "ready" || status === "error") &&
                    input.trim()
                  ) {
                    updateAttachments(); // Ensure attachments are updated before sending
                    handleSend();

                    if (files.length > 0) {
                      setFiles([]);
                    }
                  }
                }}
                disabled={isDisabled}
              >
                {status === "submitted" ? (
                  <Loader2Icon className="animate-spin" />
                ) : status === "streaming" ? (
                  <SquareIcon className="size-5 fill-current" />
                ) : (
                  <ArrowUpIcon className="size-5 " />
                )}
              </Button>
            </PromptInputAction>
          </div>
        </PromptInputActions>
      </PromptInput>
      <FileUploadContent>
        <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
          <div className="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
            <div className="mb-4 flex justify-center">
              <svg
                className="text-muted size-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-center text-base font-medium">
              Drop files to upload
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              {!isSignedIn
                ? "Please sign in to upload files"
                : fileStates.atMaxFiles
                  ? `Maximum ${MAX_FILES} files reached`
                  : `Images (JPG, PNG) or PDFs only. Maximum ${MAX_FILES} files, 5MB each.`}
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
}
