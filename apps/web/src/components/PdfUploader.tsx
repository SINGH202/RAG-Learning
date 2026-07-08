"use client";

type PdfUploaderProps = {
  disabled?: boolean;
  uploading?: boolean;
  onFileSelected: (file: File) => void;
  error?: string | null;
};

export function PdfUploader({
  disabled = false,
  uploading = false,
  onFileSelected,
  error,
}: PdfUploaderProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    onFileSelected(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-3">
      <label
        className={[
          "group relative flex cursor-pointer flex-col items-center justify-center gap-3",
          "rounded-2xl border border-dashed border-ink/20 bg-paper/60 px-6 py-10",
          "transition hover:border-teal/50 hover:bg-paper",
          disabled || uploading ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={handleChange}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal">
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          ) : (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
              <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
            </svg>
          )}
        </div>
        <div className="text-center">
          <p className="font-display text-lg text-ink">
            {uploading ? "Indexing your PDF…" : "Drop a PDF or click to upload"}
          </p>
          <p className="mt-1 text-sm text-ink/55">
            Max 10 MB · text-based PDFs work best
          </p>
        </div>
      </label>
      {error ? (
        <p className="text-sm text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
