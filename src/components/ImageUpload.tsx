import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
}

export function ImageUpload({ value, onChange, bucket = 'public_assets' }: Props) {
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      onChange(data.publicUrl);
      toast.success('Image uploaded!');
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Upload" className="w-32 h-32 object-cover rounded-xl border border-border" />
          <button 
            onClick={() => onChange('')} 
            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          ) : (
            <div className="flex flex-col items-center text-primary/70">
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-xs font-semibold">Upload</span>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={uploadImage} 
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
          />
        </div>
      )}
    </div>
  );
}
