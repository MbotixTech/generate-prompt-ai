import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export default function PromptResult({ result, type }) {
  const [copied, setCopied] = useState(false);
  
  const cleanPromptText = (text) => {
    // If no text, return empty string
    if (!text) return '';
    
    // Remove prefixes like "AI Video Prompt:" and extra quotation marks
    let cleaned = text;
    
    // Remove "AI Video Prompt:" prefix if it exists
    cleaned = cleaned.replace(/^AI Video Prompt:\s*/i, '');
    
    // Remove "Image Prompt:" prefix if it exists
    cleaned = cleaned.replace(/^Image Prompt:\s*/i, '');
    
    // Remove all section separators (---)
    cleaned = cleaned.replace(/\n---\n/g, '\n\n');
    
    // Replace all markdown bold formatting with plain text
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Replace multiple consecutive newlines with just two newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Remove extra quotation marks at the beginning and end
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    
    // Trim any extra whitespace
    cleaned = cleaned.trim();
    
    // Make sure we're not sanitizing any NSFW content by accident
    // This ensures the prompt is returned exactly as generated
    return cleaned;
  };
  
  const formatPromptDisplay = (text) => {
    if (!text) return '';
    
    // Split into sections for better display
    const parts = text.split('---');
    if (parts.length <= 1) return <pre className="whitespace-pre-wrap">{text}</pre>;
    
    return parts.map((part, index) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return null;
      
      // Add bold formatting to headings but keep the content easily copyable
      const formattedPart = trimmedPart.replace(/\*\*(.*?)\*\*/g, (match, group) => {
        return `<strong>${group}</strong>`;
      });
      
      return (
        <div key={index} className={index > 0 ? "mt-4 pt-2 border-t border-dashed" : ""}>
          <div dangerouslySetInnerHTML={{ __html: formattedPart }} />
        </div>
      );
    });
  };
  
  const copyToClipboard = () => {
    const cleanedText = cleanPromptText(result.aiResult);
    navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Function to extract platform name for usage tips
  const getPlatformTips = () => {
    const platform = result.originalFields.aiPlatform || '';
    
    if (platform.toLowerCase().includes('veo')) {
      return "Salin prompt ini dan tempel langsung di Veo 3 AI. Gunakan seluruh prompt tanpa perubahan untuk hasil terbaik.";
    } else if (platform.toLowerCase().includes('midjourney')) {
      return "Tempel prompt ini di Discord dengan awalan '/imagine' untuk Midjourney. Gunakan parameter tambahan seperti --ar 16:9 jika diperlukan.";
    } else if (platform.toLowerCase().includes('dalle')) {
      return "Salin prompt ini dan tempel langsung di DALL-E. Hindari mengedit prompt untuk mendapatkan hasil yang konsisten.";
    } else if (platform.toLowerCase().includes('stable')) {
      return "Gunakan prompt ini di Stable Diffusion. Tambahkan parameter model dan sampler jika diperlukan di UI.";
    } else if (platform.toLowerCase().includes('sora')) {
      return "Salin prompt ini dan tempel langsung di OpenAI Sora untuk hasil video terbaik.";
    } else if (platform.toLowerCase().includes('gemini')) {
      return "Salin prompt ini dan tempel langsung di Gemini untuk hasil optimal sesuai dengan permintaan Anda.";
    } else if (type === 'veo') {
      return "Salin prompt ini dan tempel langsung ke platform AI video generator pilihan Anda.";
    } else {
      return "Salin prompt ini dan tempel langsung ke platform AI image generator pilihan Anda.";
    }
  };
  
  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-muted/50 pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>
            {type === 'veo' ? 'Video Prompt' : 'Image Prompt'} 
            <span className="text-xs ml-2 text-muted-foreground">
              ({result.originalFields.aiPlatform || 'Standard Format'})
            </span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              AI Platform-Ready Prompt: 
              <span className="font-normal text-xs ml-2 text-primary">
                {result.originalFields.aiPlatform || (type === 'veo' ? 'Video Generator' : 'Image Generator')}
              </span>
            </h3>
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              <span>{copied ? 'Tersalin' : 'Salin Prompt'}</span>
            </Button>
          </div>
          <div className="text-sm bg-muted/80 p-4 rounded-md overflow-auto max-h-[500px] text-foreground border border-border font-mono">
            {formatPromptDisplay(cleanPromptText(result.aiResult))}
          </div>
          <div className="mt-2 px-2 py-1.5 bg-primary/10 text-primary dark:bg-primary/20 rounded text-xs">
            <strong>Tip:</strong> {getPlatformTips()}
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Input Anda (Bahasa Indonesia):</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(result.originalFields)
                .filter(([key, value]) => value && value !== "" && 
                       // Only filter out these fields if they're going to be shown in the Pro settings or Character Details sections
                       ((key !== 'visualStyle' && key !== 'duration' && key !== 'aspectRatio' && 
                         key !== 'frameRate' && key !== 'cameraMovement' && key !== 'cameraAngle' && 
                         key !== 'lensType' && key !== 'depthOfField' && key !== 'subject' && 
                         key !== 'clothing' && key !== 'timeOfDay' && key !== 'weather' &&
                         key !== 'aiPlatform' && key !== 'ethnicity' && key !== 'bodyShape' &&
                         key !== 'hairColor' && key !== 'hairLength' && key !== 'skinTone' &&
                         key !== 'breastSize') || 
                        // Or if the Advanced/Pro sections aren't shown at all
                        (!result.originalFields.visualStyle && !result.originalFields.aiPlatform && 
                         !result.originalFields.ethnicity && !result.originalFields.bodyShape)))
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2">
                    <div className="font-medium capitalize text-foreground">{key}:</div>
                    <div className="col-span-2 text-foreground">{value}</div>
                  </div>
              ))}
            </div>
          </div>
          
          {/* Advanced Pro Settings Section */}
          {(result.originalFields.visualStyle || result.originalFields.aiPlatform) && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2 text-foreground">Pro Settings:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {result.originalFields.aiPlatform && (
                  <div className="col-span-2">
                    <span className="font-medium text-foreground">AI Platform:</span> <span className="text-foreground">{result.originalFields.aiPlatform}</span>
                  </div>
                )}
                {result.originalFields.visualStyle && (
                  <div>
                    <span className="font-medium text-foreground">Visual Style:</span> <span className="text-foreground">{result.originalFields.visualStyle}</span>
                  </div>
                )}
                {result.originalFields.aspectRatio && (
                  <div>
                    <span className="font-medium text-foreground">Aspect Ratio:</span> <span className="text-foreground">{result.originalFields.aspectRatio}</span>
                  </div>
                )}
                {result.originalFields.frameRate && (
                  <div>
                    <span className="font-medium text-foreground">Frame Rate:</span> <span className="text-foreground">{result.originalFields.frameRate}</span>
                  </div>
                )}
                {result.originalFields.cameraMovement && (
                  <div>
                    <span className="font-medium text-foreground">Camera Movement:</span> <span className="text-foreground">{result.originalFields.cameraMovement}</span>
                  </div>
                )}
                {result.originalFields.cameraAngle && (
                  <div>
                    <span className="font-medium text-foreground">Camera Angle:</span> <span className="text-foreground">{result.originalFields.cameraAngle}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Character Customization Section */}
          {(result.originalFields.ethnicity || result.originalFields.bodyShape || 
            result.originalFields.hairColor || result.originalFields.hairLength || 
            result.originalFields.skinTone || result.originalFields.breastSize) && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2 text-foreground">Character Details:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {result.originalFields.ethnicity && (
                  <div>
                    <span className="font-medium text-foreground">Ethnicity/Face:</span> <span className="text-foreground">{result.originalFields.ethnicity}</span>
                  </div>
                )}
                {result.originalFields.bodyShape && (
                  <div>
                    <span className="font-medium text-foreground">Body Shape:</span> <span className="text-foreground">{result.originalFields.bodyShape}</span>
                  </div>
                )}
                {result.originalFields.hairColor && (
                  <div>
                    <span className="font-medium text-foreground">Hair Color:</span> <span className="text-foreground">{result.originalFields.hairColor}</span>
                  </div>
                )}
                {result.originalFields.hairLength && (
                  <div>
                    <span className="font-medium text-foreground">Hair Length:</span> <span className="text-foreground">{result.originalFields.hairLength}</span>
                  </div>
                )}
                {result.originalFields.skinTone && (
                  <div>
                    <span className="font-medium text-foreground">Skin Tone:</span> <span className="text-foreground">{result.originalFields.skinTone}</span>
                  </div>
                )}
                {result.originalFields.clothing && (
                  <div>
                    <span className="font-medium text-foreground">Clothing:</span> <span className="text-foreground">{result.originalFields.clothing}</span>
                  </div>
                )}
                {result.originalFields.breastSize && (
                  <div>
                    <span className="font-medium text-foreground">Breast Size:</span> <span className="text-foreground">{result.originalFields.breastSize}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Input yang Digunakan (English - Dikirim ke AI):</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(result.translatedFields)
                .filter(([key]) => key !== 'visualStyle' && key !== 'duration' && key !== 'aspectRatio' && 
                          key !== 'frameRate' && key !== 'cameraMovement' && key !== 'cameraAngle' && 
                          key !== 'lensType' && key !== 'depthOfField' && key !== 'subject' && 
                          key !== 'clothing' && key !== 'timeOfDay' && key !== 'weather' &&
                          key !== 'aiPlatform' && key !== 'ethnicity' && key !== 'bodyShape' &&
                          key !== 'hairColor' && key !== 'hairLength' && key !== 'skinTone' &&
                          key !== 'breastSize' ||
                          result.translatedFields[key])
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2">
                    <div className="font-medium capitalize text-foreground">{key}:</div>
                    <div className="col-span-2 text-foreground">{value}</div>
                  </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Usage Tips Section */}
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-sm font-semibold mb-2 text-foreground">Tips Penggunaan Prompt:</h3>
          <div className="text-sm text-foreground">
            {getPlatformTips()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
