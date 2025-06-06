import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Form, FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/toast.context';
import { useAuth } from '@/contexts/auth.context';
import { api } from '@/services/api';
import { translateText } from '@/services/translate';
import PromptResult from '@/components/prompt/PromptResult';
import './form.css';

// Predefined options for Pro users with bilingual support
const imageStyles = [
  { id: "photorealistic", label: { en: "Photorealistic", id: "Fotorealis" }},
  { id: "hyperrealistic", label: { en: "Hyperrealistic", id: "Hiperrealis" }},
  { id: "digital_art", label: { en: "Digital Art", id: "Seni Digital" }},
  { id: "concept_art", label: { en: "Concept Art", id: "Seni Konsep" }},
  { id: "oil_painting", label: { en: "Oil Painting", id: "Lukisan Minyak" }},
  { id: "watercolor", label: { en: "Watercolor", id: "Cat Air" }},
  { id: "pencil_drawing", label: { en: "Pencil Drawing", id: "Gambar Pensil" }},
  { id: "3d_render", label: { en: "3D Render", id: "Render 3D" }},
  { id: "anime", label: { en: "Anime", id: "Anime" }},
  { id: "cartoon", label: { en: "Cartoon", id: "Kartun" }},
  { id: "pixel_art", label: { en: "Pixel Art", id: "Seni Pixel" }},
  { id: "sketch", label: { en: "Sketch", id: "Sketsa" }},
  { id: "comic_book", label: { en: "Comic Book", id: "Komik" }},
  { id: "vintage", label: { en: "Vintage", id: "Vintage" }},
  { id: "cyberpunk", label: { en: "Cyberpunk", id: "Cyberpunk" }},
  { id: "fantasy", label: { en: "Fantasy", id: "Fantasi" }},
  { id: "sci_fi", label: { en: "Sci-Fi", id: "Fiksi Ilmiah" }}
];

const environments = [
  { id: "indoor", label: { en: "Indoor", id: "Dalam Ruangan" }},
  { id: "outdoor", label: { en: "Outdoor", id: "Luar Ruangan" }},
  { id: "urban", label: { en: "Urban", id: "Perkotaan" }},
  { id: "rural", label: { en: "Rural", id: "Pedesaan" }},
  { id: "forest", label: { en: "Forest", id: "Hutan" }},
  { id: "mountain", label: { en: "Mountain", id: "Gunung" }},
  { id: "beach", label: { en: "Beach", id: "Pantai" }},
  { id: "desert", label: { en: "Desert", id: "Gurun" }},
  { id: "jungle", label: { en: "Jungle", id: "Rimba" }},
  { id: "space", label: { en: "Space", id: "Luar Angkasa" }},
  { id: "underwater", label: { en: "Underwater", id: "Bawah Air" }},
  { id: "fantasy_world", label: { en: "Fantasy World", id: "Dunia Fantasi" }},
  { id: "cityscape", label: { en: "Cityscape", id: "Pemandangan Kota" }},
  { id: "futuristic", label: { en: "Futuristic", id: "Futuristik" }},
  { id: "medieval", label: { en: "Medieval", id: "Abad Pertengahan" }}
];

const lightingStyles = [
  { id: "natural", label: { en: "Natural", id: "Alami" }},
  { id: "soft", label: { en: "Soft", id: "Lembut" }},
  { id: "harsh", label: { en: "Harsh", id: "Keras" }},
  { id: "dramatic", label: { en: "Dramatic", id: "Dramatis" }},
  { id: "studio", label: { en: "Studio", id: "Studio" }},
  { id: "backlit", label: { en: "Backlit", id: "Siluet" }},
  { id: "rim_light", label: { en: "Rim Light", id: "Cahaya Tepi" }},
  { id: "high_key", label: { en: "High Key", id: "Kunci Tinggi" }},
  { id: "low_key", label: { en: "Low Key", id: "Kunci Rendah" }},
  { id: "cinematic", label: { en: "Cinematic", id: "Sinematik" }},
  { id: "neon", label: { en: "Neon", id: "Neon" }},
  { id: "golden_hour", label: { en: "Golden Hour", id: "Jam Emas" }},
  { id: "moonlight", label: { en: "Moonlight", id: "Cahaya Bulan" }}
];

const colorTones = [
  { id: "warm", label: { en: "Warm", id: "Hangat" }},
  { id: "cool", label: { en: "Cool", id: "Sejuk" }},
  { id: "vibrant", label: { en: "Vibrant", id: "Hidup" }},
  { id: "muted", label: { en: "Muted", id: "Redup" }},
  { id: "monochrome", label: { en: "Monochrome", id: "Monokrom" }},
  { id: "sepia", label: { en: "Sepia", id: "Sepia" }},
  { id: "black_and_white", label: { en: "Black & White", id: "Hitam & Putih" }},
  { id: "pastel", label: { en: "Pastel", id: "Pastel" }},
  { id: "neon", label: { en: "Neon", id: "Neon" }},
  { id: "dark", label: { en: "Dark", id: "Gelap" }},
  { id: "light", label: { en: "Light", id: "Terang" }},
  { id: "vintage", label: { en: "Vintage", id: "Vintage" }},
  { id: "hdr", label: { en: "HDR", id: "HDR" }}
];

const cameraAngles = [
  { id: "eye_level", label: { en: "Eye Level", id: "Setinggi Mata" }},
  { id: "birds_eye_view", label: { en: "Bird's Eye View", id: "Tampak Atas" }},
  { id: "low_angle", label: { en: "Low Angle", id: "Sudut Rendah" }},
  { id: "dutch_angle", label: { en: "Dutch Angle", id: "Sudut Miring" }},
  { id: "over_the_shoulder", label: { en: "Over the Shoulder", id: "Dari Balik Bahu" }},
  { id: "wide_angle", label: { en: "Wide Angle", id: "Sudut Lebar" }},
  { id: "macro", label: { en: "Macro", id: "Makro" }},
  { id: "telephoto", label: { en: "Telephoto", id: "Telefoto" }},
  { id: "fisheye", label: { en: "Fisheye", id: "Mata Ikan" }},
  { id: "portrait", label: { en: "Portrait", id: "Potret" }}
];

// Character customization options
const ethnicities = [
  { id: "european", label: { en: "European", id: "Eropa" }},
  { id: "east_asian", label: { en: "East Asian", id: "Asia Timur" }},
  { id: "south_asian", label: { en: "South Asian", id: "Asia Selatan" }},
  { id: "middle_eastern", label: { en: "Middle Eastern", id: "Timur Tengah" }},
  { id: "african", label: { en: "African", id: "Afrika" }},
  { id: "hispanic_latino", label: { en: "Hispanic/Latino", id: "Hispanik/Latino" }},
  { id: "southeast_asian", label: { en: "Southeast Asian", id: "Asia Tenggara" }},
  { id: "pacific_islander", label: { en: "Pacific Islander", id: "Penduduk Kepulauan Pasifik" }},
  { id: "indigenous", label: { en: "Indigenous", id: "Pribumi" }},
  { id: "mixed", label: { en: "Mixed", id: "Campuran" }}
];

const bodyShapes = [
  { id: "athletic", label: { en: "Athletic", id: "Atletis" }},
  { id: "slim", label: { en: "Slim", id: "Langsing" }},
  { id: "muscular", label: { en: "Muscular", id: "Berotot" }},
  { id: "curvy", label: { en: "Curvy", id: "Berlekuk" }},
  { id: "plus_size", label: { en: "Plus Size", id: "Ukuran Plus" }},
  { id: "petite", label: { en: "Petite", id: "Mungil" }},
  { id: "tall", label: { en: "Tall", id: "Tinggi" }},
  { id: "average", label: { en: "Average", id: "Rata-rata" }},
  { id: "hourglass", label: { en: "Hourglass", id: "Jam Pasir" }},
  { id: "pear_shaped", label: { en: "Pear-shaped", id: "Bentuk Pir" }}
];

const hairColors = [
  { id: "black", label: { en: "Black", id: "Hitam" }},
  { id: "brown", label: { en: "Brown", id: "Coklat" }},
  { id: "blonde", label: { en: "Blonde", id: "Pirang" }},
  { id: "red", label: { en: "Red", id: "Merah" }},
  { id: "auburn", label: { en: "Auburn", id: "Auburn" }},
  { id: "gray", label: { en: "Gray", id: "Abu-Abu" }},
  { id: "white", label: { en: "White", id: "Putih" }},
  { id: "blue", label: { en: "Blue", id: "Biru" }},
  { id: "green", label: { en: "Green", id: "Hijau" }},
  { id: "purple", label: { en: "Purple", id: "Ungu" }},
  { id: "pink", label: { en: "Pink", id: "Merah Muda" }},
  { id: "ombre", label: { en: "Ombre", id: "Ombre" }},
  { id: "highlights", label: { en: "Highlights", id: "Highlight" }}
];

const hairLengths = [
  { id: "bald", label: { en: "Bald", id: "Botak" }},
  { id: "buzz_cut", label: { en: "Buzz Cut", id: "Cepak" }},
  { id: "short", label: { en: "Short", id: "Pendek" }},
  { id: "medium", label: { en: "Medium", id: "Sedang" }},
  { id: "long", label: { en: "Long", id: "Panjang" }},
  { id: "very_long", label: { en: "Very Long", id: "Sangat Panjang" }},
  { id: "pixie_cut", label: { en: "Pixie Cut", id: "Potongan Pixie" }},
  { id: "bob", label: { en: "Bob", id: "Bob" }},
  { id: "shoulder_length", label: { en: "Shoulder Length", id: "Sepanjang Bahu" }},
  { id: "waist_length", label: { en: "Waist Length", id: "Sepanjang Pinggang" }}
];

const skinTones = [
  { id: "very_fair", label: { en: "Very Fair", id: "Sangat Cerah" }},
  { id: "fair", label: { en: "Fair", id: "Cerah" }},
  { id: "medium", label: { en: "Medium", id: "Sedang" }},
  { id: "olive", label: { en: "Olive", id: "Zaitun" }},
  { id: "tan", label: { en: "Tan", id: "Sawo Matang" }},
  { id: "brown", label: { en: "Brown", id: "Coklat" }},
  { id: "dark_brown", label: { en: "Dark Brown", id: "Coklat Gelap" }},
  { id: "black", label: { en: "Black", id: "Hitam" }},
  { id: "porcelain", label: { en: "Porcelain", id: "Porselen" }},
  { id: "golden", label: { en: "Golden", id: "Keemasan" }}
];

const breastSizes = [
  { id: "small", label: { en: "Small", id: "Kecil" }},
  { id: "medium", label: { en: "Medium", id: "Sedang" }},
  { id: "large", label: { en: "Large", id: "Besar" }},
  { id: "very_large", label: { en: "Very Large", id: "Sangat Besar" }},
  { id: "not_applicable", label: { en: "Not Applicable", id: "Tidak Berlaku" }}
];

const clothingStyles = [
  { id: "casual", label: { en: "Casual", id: "Kasual" }},
  { id: "formal", label: { en: "Formal", id: "Formal" }},
  { id: "business", label: { en: "Business", id: "Bisnis" }},
  { id: "vintage", label: { en: "Vintage", id: "Vintage" }},
  { id: "modern", label: { en: "Modern", id: "Modern" }},
  { id: "futuristic", label: { en: "Futuristic", id: "Futuristik" }},
  { id: "traditional", label: { en: "Traditional", id: "Tradisional" }},
  { id: "sports", label: { en: "Sports", id: "Olahraga" }},
  { id: "beach", label: { en: "Beach", id: "Pantai" }},
  { id: "winter", label: { en: "Winter", id: "Musim Dingin" }},
  { id: "swimwear", label: { en: "Swimwear", id: "Pakaian Renang" }},
  { id: "bikini", label: { en: "Bikini", id: "Bikini" }},
  { id: "lingerie", label: { en: "Lingerie", id: "Pakaian Dalam" }},
  { id: "sleepwear", label: { en: "Sleepwear", id: "Pakaian Tidur" }},
  { id: "streetwear", label: { en: "Streetwear", id: "Pakaian Jalanan" }},
  { id: "none", label: { en: "None", id: "Tidak Ada" }}
];

// AI platforms
const imageAiPlatforms = [
  { id: "dall_e", label: { en: "DALL-E", id: "DALL-E" }},
  { id: "midjourney", label: { en: "Midjourney", id: "Midjourney" }},
  { id: "stable_diffusion", label: { en: "Stable Diffusion", id: "Stable Diffusion" }},
  { id: "gemini", label: { en: "Gemini", id: "Gemini" }},
  { id: "firefly", label: { en: "Firefly", id: "Firefly" }},
  { id: "leonardo_ai", label: { en: "Leonardo AI", id: "Leonardo AI" }},
  { id: "generic_image_ai", label: { en: "Generic Image AI", id: "AI Gambar Generik" }}
];

export default function ImagePromptForm({ onSuccess }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  
  // Helper function to get the appropriate label based on current language
  const getLocalizedLabel = (labelObj) => {
    if (!labelObj) return '';
    return labelObj[i18n.language] || labelObj.en || '';
  };
  
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm();

  const isPro = user?.role === 'pro' || user?.role === 'admin';
  
  const onSubmit = async (data) => {
    if (user?.role === 'free' && user?.promptsToday >= 2) {
      toast({
        title: t('quota.title'),
        description: t('quota.used_up'),
        variant: "destructive",
      });
      return;
    }
    
    // Validate essential fields
    const requiredFields = ['subject', 'style', 'environment', 'lighting', 'colorTone', 'additionalDetails'];
    for (const field of requiredFields) {
      if (!data[field]) {
        toast({
          title: t('common.error'),
          description: t(`image_prompt.${field}_required`, { defaultValue: `${field} is required.` }),
          variant: "destructive",
        });
        return;
      }
    }
    
    // Convert underscores to proper case in field names for consistency
    if (isPro && advancedMode) {
      // Ensure all field names match what the backend expects
      // These mappings ensure data consistency between frontend and backend
      if (data.body_shape) {
        data.bodyShape = data.body_shape;
        delete data.body_shape;
      }
      if (data.hair_color) {
        data.hairColor = data.hair_color;
        delete data.hair_color;
      }
      if (data.hair_length) {
        data.hairLength = data.hair_length;
        delete data.hair_length;
      }
      if (data.skin_tone) {
        data.skinTone = data.skin_tone;
        delete data.skin_tone;
      }
      if (data.breast_size) {
        data.breastSize = data.breast_size;
        delete data.breast_size;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data for submission
      const formData = { ...data };
      
      // Debug log to troubleshoot
      console.log('Sending form data:', formData);
      
      // Send request to backend
      const response = await api.post('/prompt/image', formData);
      
      setResult(response.data.prompt);
      
      toast({
        title: t('common.success'),
        description: t('prompts.success_message'),
        variant: "default",
      });
      
      // Notify parent component
      if (onSuccess) onSuccess();
      
      // Don't reset form if successful so user can see what they submitted
    } catch (error) {
      console.error('Failed to create Image prompt:', error);
      
      // Extract the detailed error message from the server response when available
      let errorMessage = t('prompts.error_message');
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = t('errors.network_error', 'Server connection error. Please check your internet connection.');
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = t('errors.timeout', 'Request timed out. Please try again.');
      } else if (error.response?.status === 400) {
        errorMessage = t('errors.bad_request', 'Bad request - please check all required fields are filled.');
      } else if (error.response?.status === 401) {
        errorMessage = t('errors.unauthorized', 'Authentication error. Please log in again.');
      }
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelect = (name, label, options, required = false) => {
    // Debug check to ensure options array exists
    if (!options || !Array.isArray(options) || options.length === 0) {
      console.warn(`No options provided for ${name} select`);
    }
    
    return (
      <FormField
        name={name}
        label={t(`image_prompt.${label || name}`)}
        error={errors[name]?.message}
      >
        <select
          id={name}
          className="w-full p-2 border rounded-md bg-background text-foreground dark:border-gray-700 custom-select"
          {...register(name, required ? { required: t('prompts.required') } : {})}
        >
          <option value="" className="bg-background text-foreground">{t('common.choose')} {t(`image_prompt.${label || name}`)}</option>
          {options && options.map((option) => (
            <option 
              key={option.id || option} 
              value={option.id || option}
              className="bg-background text-foreground"
            >
              {option.label ? getLocalizedLabel(option.label) : option}
            </option>
          ))}
        </select>
      </FormField>
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">{t('tabs.image_prompt')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('common.create_prompt')}
        </p>
        {isPro && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="advanced-mode-image"
                checked={advancedMode}
                onChange={() => {
                  // Get current form values before toggling
                  const currentValues = getValues();
                  setAdvancedMode(!advancedMode);
                  
                  // Make sure values are preserved when switching modes
                  if (currentValues) {
                    // Small delay to ensure form fields are rendered
                    setTimeout(() => {
                      Object.keys(currentValues).forEach(key => {
                        if (currentValues[key]) {
                          setValue(key, currentValues[key]);
                        }
                      });
                    }, 0);
                  }
                }}
                className="mr-2"
              />
              <label htmlFor="advanced-mode-image" className="text-sm font-medium text-foreground">
                {advancedMode ? t('prompts.advanced_mode') : t('prompts.basic_mode')} (Pro)
              </label>
            </div>
            <span className="bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-foreground text-xs px-2 py-1 rounded-full">{t('common.pro_feature')}</span>
          </div>
        )}
      </div>
      
      {result ? (
        <div className="space-y-4">
          <PromptResult result={result} type="image" />
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setResult(null)}
            >
              {t('common.reset')}
            </Button>
          </div>
        </div>
      ) : (
        <Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Form Fields (For All Users) */}
          {!isPro || !advancedMode ? (
            <>
              <FormField
                name="subject"
                label={t('image_prompt.subject')}
                error={errors.subject?.message}
              >
                <Input
                  id="subject"
                  placeholder={t('image_prompt.subject_placeholder')}
                  {...register("subject", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="style"
                label={t('image_prompt.imageStyles')}
                error={errors.style?.message}
              >
                <Input
                  id="style"
                  placeholder={t('image_prompt.imageStyles')}
                  {...register("style", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="environment"
                label={t('image_prompt.environment')}
                error={errors.environment?.message}
              >
                <Input
                  id="environment"
                  placeholder={t('image_prompt.environment')}
                  {...register("environment", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="lighting"
                label={t('image_prompt.lighting')}
                error={errors.lighting?.message}
              >
                <Input
                  id="lighting"
                  placeholder={t('image_prompt.lighting')}
                  {...register("lighting", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="colorTone"
                label={t('image_prompt.color_tone')}
                error={errors.colorTone?.message}
              >
                <Input
                  id="colorTone"
                  placeholder={t('image_prompt.color_tone')}
                  {...register("colorTone", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="cameraAngle"
                label={t('image_prompt.camera_angle')}
                error={errors.cameraAngle?.message}
              >
                <Input
                  id="cameraAngle"
                  placeholder={t('image_prompt.camera_angle')}
                  {...register("cameraAngle")}
                />
              </FormField>
              
              <FormField
                name="additionalDetails"
                label={t('image_prompt.subject_description')}
                error={errors.additionalDetails?.message}
              >
                <Textarea
                  id="additionalDetails"
                  placeholder={t('image_prompt.description_placeholder')}
                  className="min-h-[100px]"
                  {...register("additionalDetails", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="exclude"
                label={t('prompts.exclude')}
                error={errors.exclude?.message}
              >
                <Textarea
                  id="exclude"
                  placeholder={t('prompts.exclude_placeholder')}
                  className="min-h-[60px]"
                  {...register("exclude")}
                />
              </FormField>
            </>
          ) : (
            /* Advanced Form Fields (Pro Users Only) */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-1 text-foreground">{t('image_prompt.subject')}</h3>
                  <FormField
                    name="subject"
                    label={t('image_prompt.subject')}
                    error={errors.subject?.message}
                  >
                    <Textarea
                      id="subject"
                      placeholder={t('image_prompt.subject_placeholder')}
                      className="min-h-[80px]"
                      {...register("subject", { required: t('prompts.required') })}
                    />
                  </FormField>
                  
                  {/* Using 'style' as field name for both modes to match backend expectation */}
                  {renderSelect("style", "imageStyles", imageStyles, true)}
                  {renderSelect("environment", "environment", environments, true)}
                  {renderSelect("lighting", "lighting", lightingStyles, true)}
                  {renderSelect("colorTone", "color_tone", colorTones, true)}
                  {renderSelect("cameraAngle", "camera_angle", cameraAngles)}
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-1 text-foreground">{t('image_prompt.ai_platform')}</h3>
                  <div className="mb-4">
                    {renderSelect("aiPlatform", "ai_platform", imageAiPlatforms, true)}
                  </div>
                  
                  <h3 className="font-medium text-sm border-b pb-1 text-foreground">{t('image_prompt.character')}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {renderSelect("ethnicity", "ethnicity", ethnicities)}
                    {renderSelect("bodyShape", "body_shape", bodyShapes)}
                    {renderSelect("hairColor", "hair_color", hairColors)}
                    {renderSelect("hairLength", "hair_length", hairLengths)}
                    {renderSelect("skinTone", "skin_tone", skinTones)}
                    {renderSelect("clothing", "clothing", clothingStyles)}
                    {renderSelect("breastSize", "breast_size", breastSizes)}
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <FormField
                  name="additionalDetails"
                  label={t('image_prompt.subject_description')}
                  error={errors.additionalDetails?.message}
                >
                  <Textarea
                    id="additionalDetails"
                    placeholder={t('image_prompt.description_placeholder')}
                    className="min-h-[100px]"
                    {...register("additionalDetails", { required: t('prompts.required') })}
                  />
                </FormField>
                
                <FormField
                  name="exclude"
                  label={t('prompts.exclude')}
                  error={errors.exclude?.message}
                >
                  <Textarea
                    id="exclude"
                    placeholder={t('prompts.exclude_placeholder')}
                    className="min-h-[80px]"
                    {...register("exclude")}
                  />
                </FormField>
              </div>
            </>
          )}
          
          {/* 
            Developer note: 
            - In both basic and advanced modes, use 'style' field name to match backend endpoint 
            - All required fields by the backend: subject, style, environment, lighting, colorTone, additionalDetails
          */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.submit')}
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}
