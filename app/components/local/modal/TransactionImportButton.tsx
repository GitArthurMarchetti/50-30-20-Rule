"use client";

// ============================================================================
// IMPORTS
// ============================================================================
// External
import { useState, FormEvent, useRef, useEffect } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";

// Internal - Services
import { ApiError } from "@/app/lib/client/api-client";
import { getCsrfToken } from "@/app/lib/client/csrf-client";
import { pendingTransactionService } from "@/app/lib/client/pending-transaction-service";
import { TRANSACTION_IMPORT } from "@/app/lib/validation-constants";

// Internal - Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// Lazy load manager modal
const PendingTransactionsManager = dynamic(
  () => import("./PendingTransactionsManager"),
  { ssr: false }
);

// ============================================================================
// TYPES
// ============================================================================

interface TransactionImportButtonProps {
  onImportSuccess?: () => void;
  onOpenManagerModal?: () => void;
}

interface UploadStats {
  total: number;
  valid: number;
  created: number;
  duplicates: number;
  errors: number;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function TransactionImportButton({
  onImportSuccess,
  onOpenManagerModal,
}: TransactionImportButtonProps) {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [open, setOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // Fetch Pending Count on Mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchPendingCount = async () => {
      setIsLoadingCount(true);
      try {
        const pending = await pendingTransactionService.getAll();
        setPendingCount(pending.length);
      } catch (err) {
        // Silently fail - button will show default state
        setPendingCount(0);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchPendingCount();
  }, []);

  // --------------------------------------------------------------------------
  // Refresh Pending Count
  // --------------------------------------------------------------------------
  const refreshPendingCount = async () => {
    try {
      const pending = await pendingTransactionService.getAll();
      setPendingCount(pending.length);
    } catch (err) {
      // Silently fail
    }
  };

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const isValidType =
      fileName.endsWith(".csv") || fileName.endsWith(".json");

    if (!isValidType) {
      setError("Please select a CSV or JSON file");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size
    // WHY: Use centralized constant to ensure consistency with server-side validation
    if (file.size > TRANSACTION_IMPORT.MAX_FILE_SIZE_BYTES) {
      const maxSizeMB = TRANSACTION_IMPORT.MAX_FILE_SIZE_BYTES / 1024 / 1024;
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setError("");
    setSuccess(false);
    setUploadStats(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError("");
    setSuccess(false);
    setUploadStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess(false);
    setUploadProgress(0);

    try {
      // Simulate progress (since we can't track actual upload progress with fetch)
      // WHY: Provides user feedback during upload - uses constants for consistent behavior
      const progressInterval = setInterval(() => {
        setUploadProgress((previousProgress) => {
          if (previousProgress >= TRANSACTION_IMPORT.UPLOAD_PROGRESS.MAX_BEFORE_COMPLETE) {
            clearInterval(progressInterval);
            return TRANSACTION_IMPORT.UPLOAD_PROGRESS.MAX_BEFORE_COMPLETE;
          }
          return previousProgress + TRANSACTION_IMPORT.UPLOAD_PROGRESS.INCREMENT_PERCENT;
        });
      }, TRANSACTION_IMPORT.UPLOAD_PROGRESS.INTERVAL_MS);

      // Get CSRF token
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error("Failed to obtain CSRF token");
      }

      // Create FormData
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Upload file
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      const result = await response.json();

      // Set success state
      setSuccess(true);
      setUploadStats(result.stats || null);

      // Refresh pending count
      await refreshPendingCount();

      // Call success callback
      if (onImportSuccess) {
        onImportSuccess();
      }

      // Auto-close after delay and open manager modal
      // WHY: Gives user time to see success message before auto-opening manager
      setTimeout(() => {
        setOpen(false);
        setManagerOpen(true);
        if (onOpenManagerModal) {
          onOpenManagerModal();
        }
        // Reset state
        handleRemoveFile();
        setUploadProgress(0);
        setIsUploading(false);
      }, TRANSACTION_IMPORT.UPLOAD_PROGRESS.AUTO_CLOSE_DELAY_MS);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "An unknown error occurred during upload";
      setError(message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog closes
      handleRemoveFile();
      setUploadProgress(0);
      setIsUploading(false);
      setSuccess(false);
    }
  };

  const handleImportClick = () => {
    setOpen(true);
  };

  const handlePendingClick = () => {
    setManagerOpen(true);
  };

  const handleManagerClose = async () => {
    setManagerOpen(false);
    // Refresh count after manager closes
    await refreshPendingCount();
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <>
      <div className="flex items-center gap-2">
        {/* Import File Button - Always visible */}
        <button
          className="simple-button-style flex items-center gap-2"
          type="button"
          onClick={handleImportClick}
          disabled={isLoadingCount}
        >
          <Upload size={20} />
          <span className="text-sm">Import File</span>
        </button>

        {/* Pending Transactions Button - Only visible when count > 0 */}
        {!isLoadingCount && pendingCount > 0 && (
          <button
            className="simple-button-style flex items-center gap-2"
            type="button"
            onClick={handlePendingClick}
          >
            <FileText size={20} />
            <span className="text-sm">Pending ({pendingCount})</span>
          </button>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-none">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to import transactions. The file will be
            validated and processed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <label
              htmlFor="file-upload"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Select File
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                accept=".csv,.json"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-input bg-background">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-sm hover:bg-accent transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Loading Skeleton for Stats */}
          {isUploading && uploadProgress === 100 && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {/* Success Message */}
          {success && uploadStats && (
            <div className="p-4 rounded-md border border-green-500/50 bg-green-500/10">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-green-500">
                    Import completed successfully!
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Total rows: {uploadStats.total}</p>
                    <p>Valid: {uploadStats.valid}</p>
                    <p>Created: {uploadStats.created}</p>
                    {uploadStats.duplicates > 0 && (
                      <p>Duplicates skipped: {uploadStats.duplicates}</p>
                    )}
                    {uploadStats.errors > 0 && (
                      <p className="text-yellow-500">
                        Errors: {uploadStats.errors}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isUploading}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading || success}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : success ? "Success!" : "Upload"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>

      {/* Pending Transactions Manager */}
      <PendingTransactionsManager
        isOpen={managerOpen}
        onClose={handleManagerClose}
        onImportSuccess={async () => {
          await refreshPendingCount();
          if (onImportSuccess) {
            onImportSuccess();
          }
        }}
      />
    </>
  );
}
