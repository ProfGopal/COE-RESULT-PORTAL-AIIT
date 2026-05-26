type DropZoneProps = {
  onFiles: (files: FileList | File[]) => void;
  uploadLabel?: string;
  disabled?: boolean;
};

export default function DropZone({ onFiles, uploadLabel = 'Upload Excel / CSV', disabled }: DropZoneProps) {
  const handleFiles = (files: FileList | null) => {
    if (files && files.length > 0) {
      onFiles(files);
    }
  };

  return (
    <label className="group block cursor-pointer rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400 hover:bg-slate-100">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        multiple
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        className="hidden"
      />
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-slate-700">
        <div className="rounded-full bg-slate-200 p-4 text-slate-600 transition group-hover:bg-slate-300">
          📄
        </div>
        <div>
          <p className="text-lg font-semibold">{uploadLabel}</p>
          <p className="text-sm text-slate-500">Drag files here or click to select a master upload.</p>
        </div>
      </div>
    </label>
  );
}
