import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";

interface FileUploadZoneProps {
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  className?: string;
}

export function FileUploadZone({
  title,
  description,
  accept,
  multiple = false,
  files,
  onChange,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (multiple) {
        onChange([...files, ...droppedFiles]);
      } else {
        onChange([droppedFiles[0]]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      if (multiple) {
        onChange([...files, ...selectedFiles]);
      } else {
        onChange([selectedFiles[0]]);
      }
    }
  };

  const removeFile = (indexToRemove: number) => {
    onChange(files.filter((_, index) => index !== indexToRemove));
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[240px] p-6 text-center group",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/20",
          files.length > 0 && !multiple && "border-solid border-primary/20 bg-secondary/10"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerSelect}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleFileChange}
        />

        {files.length === 0 || multiple ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <UploadCloud className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-serif text-lg font-medium text-foreground">
                {title}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                {description}
              </p>
            </div>
            <div className="text-xs font-medium text-primary bg-primary/5 px-3 py-1 rounded-full">
              Click or drag to upload
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={URL.createObjectURL(files[0])} 
              alt="Selected file preview" 
              className="w-full h-full object-cover opacity-80 mix-blend-multiply"
            />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
              <UploadCloud className="w-8 h-8 text-primary mb-2" />
              <p className="text-sm font-medium text-primary">Replace photo</p>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex flex-col space-y-2">
          {multiple && (
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Selected Items ({files.length})
            </div>
          )}
          {files.map((file, idx) => (
            <div 
              key={`${file.name}-${idx}`} 
              className="flex items-center justify-between p-3 rounded-lg bg-card border shadow-sm group animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 rounded bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
