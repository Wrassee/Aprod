// src/components/add-error-modal.tsx - THEME AWARE VERSION

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/theme-context'; // ← ÚJ IMPORT
import { ProtocolError, ErrorSeverity } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera, X, AlertTriangle, AlertCircle, Info, Sparkles, Save } from 'lucide-react';
import { useLanguageContext } from './language-provider';

interface AddErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (error: Omit<ProtocolError, 'id'>) => void;
  editingError?: ProtocolError | null;
}

export function AddErrorModal({ isOpen, onClose, onSave, editingError }: AddErrorModalProps) {
  const { t } = useLanguageContext();
  const { theme } = useTheme(); // ← ÚJ HOOK
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ErrorSeverity>('medium');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (editingError) {
      setTitle(editingError.title);
      setDescription(editingError.description);
      setSeverity(editingError.severity);
      setImages(editingError.images);
    } else {
      setTitle('');
      setDescription('');
      setSeverity('medium');
      setImages([]);
    }
  }, [editingError]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      severity,
      images,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setImages([]);
  };

  // ========================================
  // MODERN THEME RENDER
  // ========================================
  if (theme === 'modern') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-0 p-0">
          {/* Gradient Border Wrapper */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 p-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 opacity-50 blur-xl animate-pulse" />
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-500 bg-clip-text text-transparent">
                    {t.addErrorTitle}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 pt-0 space-y-6">
                {/* Severity Level - Card Buttons */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    {t.severity}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Critical */}
                    <button
                      type="button"
                      onClick={() => setSeverity('critical')}
                      className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 ${
                        severity === 'critical'
                          ? 'bg-gradient-to-br from-red-500 to-rose-500 text-white border-red-500 shadow-lg scale-105'
                          : 'bg-white border-gray-300 text-gray-800 hover:border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <AlertTriangle className={`h-6 w-6 mx-auto mb-2 ${
                        severity === 'critical' ? 'text-white' : 'text-red-500'
                      }`} />
                      <p className="font-semibold text-sm">{t.critical}</p>
                    </button>

                    {/* Medium */}
                    <button
                      type="button"
                      onClick={() => setSeverity('medium')}
                      className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 ${
                        severity === 'medium'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500 shadow-lg scale-105'
                          : 'bg-white border-gray-300 text-gray-800 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      <AlertCircle className={`h-6 w-6 mx-auto mb-2 ${
                        severity === 'medium' ? 'text-white' : 'text-amber-500'
                      }`} />
                      <p className="font-semibold text-sm">{t.medium}</p>
                    </button>

                    {/* Low */}
                    <button
                      type="button"
                      onClick={() => setSeverity('low')}
                      className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 ${
                        severity === 'low'
                          ? 'bg-gradient-to-br from-blue-500 to-sky-500 text-white border-blue-500 shadow-lg scale-105'
                          : 'bg-white border-gray-300 text-gray-800 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <Info className={`h-6 w-6 mx-auto mb-2 ${
                        severity === 'low' ? 'text-white' : 'text-blue-500'
                      }`} />
                      <p className="font-semibold text-sm">{t.low}</p>
                    </button>
                  </div>
                </div>

                {/* Error Title */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    {t.errorTitle}
                  </Label>
                  <div className="relative group">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief description of the error"
                      className="h-12 border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 rounded-xl transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 opacity-0 group-focus-within:opacity-100 animate-pulse transition-opacity" />
                  </div>
                </div>

                {/* Error Description */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    {t.errorDescription}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about the error"
                    rows={4}
                    className="border-2 border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 rounded-xl resize-none transition-all"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                    <Camera className="h-4 w-4 text-rose-500" />
                    {t.attachPhotos}
                  </Label>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 to-pink-50 border-2 border-dashed border-rose-300 p-8 text-center hover:border-rose-400 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-400/0 via-rose-400/5 to-rose-400/0" />
                    
                    <div className="relative">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-rose-400 rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <Camera className="relative h-12 w-12 mx-auto text-rose-500 mb-4" />
                      </div>
                      
                      <p className="text-gray-700 font-medium mb-4">{t.uploadPhotos}</p>
                      <Button
                        type="button"
                        onClick={() => document.getElementById('error-image-upload')?.click()}
                        className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {t.selectFiles}
                      </Button>
                      <input
                        id="error-image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>

                  {/* Image Preview */}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Error photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl border-2 border-gray-200 shadow-md group-hover:shadow-lg transition-all"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-red-500 to-rose-500"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="px-6 border-2 border-gray-300 hover:bg-gray-50 rounded-xl"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!title.trim() || !description.trim()}
                    className="relative overflow-hidden px-6 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all group rounded-xl disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {t.saveError}
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ========================================
  // CLASSIC THEME RENDER
  // ========================================
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[75vh] overflow-y-auto border border-gray-300 shadow-lg bg-white">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {t.addErrorTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Severity Level */}
          <div>
            <Label className="text-sm font-medium text-gray-700">{t.severity}</Label>
            <Select value={severity} onValueChange={(value: ErrorSeverity) => setSeverity(value)}>
              <SelectTrigger className="w-full mt-2 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    {t.critical}
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    {t.medium}
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    {t.low}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Title */}
          <div>
            <Label className="text-sm font-medium text-gray-700">{t.errorTitle}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the error"
              className="mt-2 border-gray-300"
            />
          </div>

          {/* Error Description */}
          <div>
            <Label className="text-sm font-medium text-gray-700">{t.errorDescription}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the error"
              rows={4}
              className="mt-2 resize-none border-gray-300"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="text-sm font-medium text-gray-700">{t.attachPhotos}</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <Camera className="h-8 w-8 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">{t.uploadPhotos}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('error-image-upload')?.click()}
                className="border-gray-300"
              >
                {t.selectFiles}
              </Button>
              <input
                id="error-image-upload"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Error photo ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border border-gray-300"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} className="border-gray-300">
              {t.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim() || !description.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t.saveError}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}