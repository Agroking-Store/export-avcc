import React, { useState, useRef } from "react";
import { X, Upload, FileText, Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { piApi } from "./piApi";
import { toast } from "react-toastify";

interface Props {
  piId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const HBLUploadModal = ({ piId, onClose, onSuccess }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await piApi.uploadHBL(piId, file);
      toast.success("HBL Document uploaded successfully");
      onSuccess();
    } catch (err) {
      toast.error("Failed to upload HBL");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-zinc-900">
            Upload HBL Document
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-200 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <FileCheck className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-zinc-900 truncate max-w-full">
                  {file.name}
                </p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-500">Click to select HBL PDF</p>
              </>
            )}
          </div>
        </div>
        <div className="p-6 bg-zinc-50 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? (
              <Loader2 className="animate-spin mr-2 w-4 h-4" />
            ) : (
              "Upload Document"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HBLUploadModal;
