import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSignature } from '@/hooks/use-signature';
import { useLanguageContext } from "@/components/language-context";
import { useTheme } from '@/contexts/theme-context';

interface SignatureCanvasProps {
  onSignatureChange: (signature: string) => void;
}

export function SignatureCanvas({ onSignatureChange }: SignatureCanvasProps) {
  const { t } = useLanguageContext();
  const { theme } = useTheme();
  const {
    canvasRef,
    signature,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    initializeCanvas,
  } = useSignature();

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    onSignatureChange(signature);
  }, [signature, onSignatureChange]);

  return (
    <div className={theme === 'modern'
      ? 'border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-8 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-900'
      : 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-800'
    }>
      <div className="text-center">
        <div className="mb-4">
          <svg
            className={`h-12 w-12 mx-auto ${theme === 'modern' ? 'text-blue-400' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <p className={`mb-4 ${theme === 'modern' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
          {t("signaturePrompt")}
        </p>

        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className={`cursor-crosshair mx-auto block bg-white dark:bg-gray-900 ${theme === 'modern'
            ? 'border-2 border-blue-200 dark:border-blue-700 rounded-xl shadow-sm'
            : 'border-2 border-gray-300 dark:border-gray-600 rounded'
          }`}
          style={{
            touchAction: 'none',
            maxWidth: '100%',
            height: 'auto'
          }}
          onPointerDown={(e) => { e.preventDefault(); startDrawing(e as any); }}
          onPointerMove={(e) => { e.preventDefault(); draw(e as any); }}
          onPointerUp={(e) => { e.preventDefault(); stopDrawing(); }}
          onPointerLeave={stopDrawing}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
          onTouchMove={(e) => { e.preventDefault(); draw(e); }}
          onTouchEnd={(e) => { e.preventDefault(); stopDrawing(); }}
        />

        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={clearSignature}
            className={theme === 'modern'
              ? 'border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
              : 'text-gray-600 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t("clear")}
          </Button>
        </div>
      </div>
    </div>
  );
}
