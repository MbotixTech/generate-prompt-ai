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
const visualStyles = [
  { id: "cinematic", label: { en: "Cinematic", id: "Sinematik" }},
  { id: "photorealistic", label: { en: "Photorealistic", id: "Fotorealis" }},
  { id: "anime", label: { en: "Anime", id: "Anime" }},
  { id: "cartoon", label: { en: "Cartoon", id: "Kartun" }},
  { id: "3d_animation", label: { en: "3D Animation", id: "Animasi 3D" }},
  { id: "stop_motion", label: { en: "Stop Motion", id: "Stop Motion" }},
  { id: "oil_painting", label: { en: "Oil Painting", id: "Lukisan Minyak" }},
  { id: "watercolor", label: { en: "Watercolor", id: "Cat Air" }},
  { id: "pencil_sketch", label: { en: "Pencil Sketch", id: "Sketsa Pensil" }},
  { id: "vintage_film", label: { en: "Vintage Film", id: "Film Vintage" }}
];

const aspectRatios = [
  { id: "16:9", label: { en: "16:9 (Widescreen)", id: "16:9 (Layar Lebar)" }},
  { id: "9:16", label: { en: "9:16 (Portrait)", id: "9:16 (Potret)" }},
  { id: "1:1", label: { en: "1:1 (Square)", id: "1:1 (Persegi)" }},
  { id: "4:3", label: { en: "4:3 (Standard)", id: "4:3 (Standar)" }},
  { id: "21:9", label: { en: "21:9 (Ultra-wide)", id: "21:9 (Ultra-lebar)" }}
];

const frameRates = [
  { id: "24fps", label: { en: "24 fps (Cinematic)", id: "24 fps (Sinematik)" }},
  { id: "30fps", label: { en: "30 fps (Standard)", id: "30 fps (Standar)" }},
  { id: "60fps", label: { en: "60 fps (Smooth)", id: "60 fps (Halus)" }}
];
const cameraMovements = [
  { id: "Static", label: { en: "Static", id: "Statis" }},
  { id: "Pan", label: { en: "Pan", id: "Pan" }},
  { id: "Tracking Shot", label: { en: "Tracking Shot", id: "Shot Tracking" }},
  { id: "Dolly Zoom", label: { en: "Dolly Zoom", id: "Dolly Zoom" }},
  { id: "Crane Shot", label: { en: "Crane Shot", id: "Shot Crane" }},
  { id: "Handheld", label: { en: "Handheld", id: "Kamera Tangan" }},
  { id: "Steadicam", label: { en: "Steadicam", id: "Steadicam" }},
  { id: "Drone Shot", label: { en: "Drone Shot", id: "Shot Drone" }}
];

const cameraAngles = [
  { id: "Eye Level", label: { en: "Eye Level", id: "Sejajar Mata" }},
  { id: "Low Angle", label: { en: "Low Angle", id: "Sudut Rendah" }},
  { id: "High Angle", label: { en: "High Angle", id: "Sudut Tinggi" }},
  { id: "Dutch Angle", label: { en: "Dutch Angle", id: "Sudut Miring" }},
  { id: "Bird's Eye View", label: { en: "Bird's Eye View", id: "Pandangan Mata Burung" }},
  { id: "Worm's Eye View", label: { en: "Worm's Eye View", id: "Pandangan Mata Cacing" }},
  { id: "Over-the-Shoulder", label: { en: "Over-the-Shoulder", id: "Dari Balik Bahu" }}
];

const lensTypes = [
  { id: "Standard (50mm)", label: { en: "Standard (50mm)", id: "Standar (50mm)" }},
  { id: "Wide Angle (24mm)", label: { en: "Wide Angle (24mm)", id: "Sudut Lebar (24mm)" }},
  { id: "Telephoto (85mm)", label: { en: "Telephoto (85mm)", id: "Telefoto (85mm)" }},
  { id: "Fish-eye", label: { en: "Fish-eye", id: "Fish-eye" }},
  { id: "Macro", label: { en: "Macro", id: "Makro" }}
];

const depthOfFields = [
  { id: "Shallow", label: { en: "Shallow", id: "Dangkal" }},
  { id: "Deep", label: { en: "Deep", id: "Dalam" }},
  { id: "Variable", label: { en: "Variable", id: "Variabel" }}
];

const timeOfDay = [
  { id: "Golden Hour", label: { en: "Golden Hour", id: "Jam Keemasan" }},
  { id: "Blue Hour", label: { en: "Blue Hour", id: "Jam Biru" }},
  { id: "Midday", label: { en: "Midday", id: "Tengah Hari" }},
  { id: "Sunset", label: { en: "Sunset", id: "Matahari Terbenam" }},
  { id: "Sunrise", label: { en: "Sunrise", id: "Matahari Terbit" }},
  { id: "Night", label: { en: "Night", id: "Malam" }},
  { id: "Dawn", label: { en: "Dawn", id: "Fajar" }},
  { id: "Dusk", label: { en: "Dusk", id: "Senja" }}
];

const weather = [
  { id: "Clear", label: { en: "Clear", id: "Cerah" }},
  { id: "Cloudy", label: { en: "Cloudy", id: "Berawan" }},
  { id: "Rainy", label: { en: "Rainy", id: "Hujan" }},
  { id: "Snowy", label: { en: "Snowy", id: "Bersalju" }},
  { id: "Foggy", label: { en: "Foggy", id: "Berkabut" }},
  { id: "Stormy", label: { en: "Stormy", id: "Badai" }},
  { id: "Windy", label: { en: "Windy", id: "Berangin" }},
  { id: "Hazy", label: { en: "Hazy", id: "Berkabut Tipis" }}
];
const subjects = [
  { id: "Man", label: { en: "Man", id: "Pria" }},
  { id: "Woman", label: { en: "Woman", id: "Wanita" }},
  { id: "Child", label: { en: "Child", id: "Anak-anak" }},
  { id: "Elderly Person", label: { en: "Elderly Person", id: "Orang Tua" }},
  { id: "Group of People", label: { en: "Group of People", id: "Kelompok Orang" }},
  { id: "Dog", label: { en: "Dog", id: "Anjing" }},
  { id: "Cat", label: { en: "Cat", id: "Kucing" }},
  { id: "Horse", label: { en: "Horse", id: "Kuda" }},
  { id: "Bird", label: { en: "Bird", id: "Burung" }},
  { id: "Fish", label: { en: "Fish", id: "Ikan" }},
  { id: "Car", label: { en: "Car", id: "Mobil" }},
  { id: "Building", label: { en: "Building", id: "Bangunan" }},
  { id: "Landscape", label: { en: "Landscape", id: "Pemandangan" }},
  { id: "Food", label: { en: "Food", id: "Makanan" }},
  { id: "Abstract", label: { en: "Abstract", id: "Abstrak" }}
];

const clothingStyles = [
  { id: "Casual", label: { en: "Casual", id: "Kasual" }},
  { id: "Formal", label: { en: "Formal", id: "Formal" }},
  { id: "Business", label: { en: "Business", id: "Bisnis" }},
  { id: "Vintage", label: { en: "Vintage", id: "Vintage" }},
  { id: "Modern", label: { en: "Modern", id: "Modern" }},
  { id: "Futuristic", label: { en: "Futuristic", id: "Futuristik" }},
  { id: "Traditional", label: { en: "Traditional", id: "Tradisional" }},
  { id: "Sports", label: { en: "Sports", id: "Olahraga" }},
  { id: "Beach", label: { en: "Beach", id: "Pantai" }},
  { id: "Winter", label: { en: "Winter", id: "Musim Dingin" }},
  { id: "Swimwear", label: { en: "Swimwear", id: "Pakaian Renang" }},
  { id: "Bikini", label: { en: "Bikini", id: "Bikini" }},
  { id: "Lingerie", label: { en: "Lingerie", id: "Lingerie" }},
  { id: "Sleepwear", label: { en: "Sleepwear", id: "Pakaian Tidur" }},
  { id: "Streetwear", label: { en: "Streetwear", id: "Streetwear" }},
  { id: "None", label: { en: "None", id: "Tidak Ada" }}
];

// Character customization options
const ethnicities = [
  { id: "European", label: { en: "European", id: "Eropa" }},
  { id: "East Asian", label: { en: "East Asian", id: "Asia Timur" }},
  { id: "South Asian", label: { en: "South Asian", id: "Asia Selatan" }},
  { id: "Middle Eastern", label: { en: "Middle Eastern", id: "Timur Tengah" }},
  { id: "African", label: { en: "African", id: "Afrika" }},
  { id: "Hispanic/Latino", label: { en: "Hispanic/Latino", id: "Hispanik/Latino" }},
  { id: "Southeast Asian", label: { en: "Southeast Asian", id: "Asia Tenggara" }},
  { id: "Pacific Islander", label: { en: "Pacific Islander", id: "Kepulauan Pasifik" }},
  { id: "Indigenous", label: { en: "Indigenous", id: "Penduduk Asli" }},
  { id: "Mixed", label: { en: "Mixed", id: "Campuran" }}
];

const bodyShapes = [
  { id: "Athletic", label: { en: "Athletic", id: "Atletis" }},
  { id: "Slim", label: { en: "Slim", id: "Langsing" }},
  { id: "Muscular", label: { en: "Muscular", id: "Berotot" }},
  { id: "Curvy", label: { en: "Curvy", id: "Berlekuk" }},
  { id: "Plus Size", label: { en: "Plus Size", id: "Ukuran Plus" }},
  { id: "Petite", label: { en: "Petite", id: "Mungil" }},
  { id: "Tall", label: { en: "Tall", id: "Tinggi" }},
  { id: "Average", label: { en: "Average", id: "Rata-rata" }},
  { id: "Hourglass", label: { en: "Hourglass", id: "Jam Pasir" }},
  { id: "Pear-shaped", label: { en: "Pear-shaped", id: "Bentuk Pir" }}
];

const hairColors = [
  { id: "Black", label: { en: "Black", id: "Hitam" }},
  { id: "Brown", label: { en: "Brown", id: "Cokelat" }},
  { id: "Blonde", label: { en: "Blonde", id: "Pirang" }},
  { id: "Red", label: { en: "Red", id: "Merah" }},
  { id: "Auburn", label: { en: "Auburn", id: "Auburn" }},
  { id: "Gray", label: { en: "Gray", id: "Abu-Abu" }},
  { id: "White", label: { en: "White", id: "Putih" }},
  { id: "Blue", label: { en: "Blue", id: "Biru" }},
  { id: "Green", label: { en: "Green", id: "Hijau" }},
  { id: "Purple", label: { en: "Purple", id: "Ungu" }},
  { id: "Pink", label: { en: "Pink", id: "Merah Muda" }},
  { id: "Ombre", label: { en: "Ombre", id: "Ombre" }},
  { id: "Highlights", label: { en: "Highlights", id: "Highlight" }}
];

const hairLengths = [
  { id: "Bald", label: { en: "Bald", id: "Botak" }},
  { id: "Buzz Cut", label: { en: "Buzz Cut", id: "Potongan Buzz" }},
  { id: "Short", label: { en: "Short", id: "Pendek" }},
  { id: "Medium", label: { en: "Medium", id: "Sedang" }},
  { id: "Long", label: { en: "Long", id: "Panjang" }},
  { id: "Very Long", label: { en: "Very Long", id: "Sangat Panjang" }},
  { id: "Pixie Cut", label: { en: "Pixie Cut", id: "Potongan Pixie" }},
  { id: "Bob", label: { en: "Bob", id: "Bob" }},
  { id: "Shoulder Length", label: { en: "Shoulder Length", id: "Sepanjang Bahu" }},
  { id: "Waist Length", label: { en: "Waist Length", id: "Sepanjang Pinggang" }}
];

const skinTones = [
  { id: "Very Fair", label: { en: "Very Fair", id: "Sangat Cerah" }},
  { id: "Fair", label: { en: "Fair", id: "Cerah" }},
  { id: "Medium", label: { en: "Medium", id: "Sedang" }},
  { id: "Olive", label: { en: "Olive", id: "Zaitun" }},
  { id: "Tan", label: { en: "Tan", id: "Kecokelatan" }},
  { id: "Brown", label: { en: "Brown", id: "Cokelat" }},
  { id: "Dark Brown", label: { en: "Dark Brown", id: "Cokelat Gelap" }},
  { id: "Black", label: { en: "Black", id: "Hitam" }},
  { id: "Porcelain", label: { en: "Porcelain", id: "Porselen" }},
  { id: "Golden", label: { en: "Golden", id: "Keemasan" }}
];

const breastSizes = [
  { id: "Small", label: { en: "Small", id: "Kecil" }},
  { id: "Medium", label: { en: "Medium", id: "Sedang" }},
  { id: "Large", label: { en: "Large", id: "Besar" }},
  { id: "Very Large", label: { en: "Very Large", id: "Sangat Besar" }},
  { id: "Not Applicable", label: { en: "Not Applicable", id: "Tidak Berlaku" }}
];

// AI platforms
const videoAiPlatforms = [
  { id: "Veo 3", label: { en: "Veo 3", id: "Veo 3" }},
  { id: "Sora", label: { en: "Sora", id: "Sora" }},
  { id: "Gen-2", label: { en: "Gen-2", id: "Gen-2" }},
  { id: "Pika", label: { en: "Pika", id: "Pika" }},
  { id: "Gemini", label: { en: "Gemini", id: "Gemini" }},
  { id: "Runway", label: { en: "Runway", id: "Runway" }},
  { id: "D-ID", label: { en: "D-ID", id: "D-ID" }},
  { id: "Generic Video AI", label: { en: "Generic Video AI", id: "AI Video Umum" }}
];

const imageAiPlatforms = [
  { id: "DALL-E", label: { en: "DALL-E", id: "DALL-E" }},
  { id: "Midjourney", label: { en: "Midjourney", id: "Midjourney" }},
  { id: "Stable Diffusion", label: { en: "Stable Diffusion", id: "Stable Diffusion" }},
  { id: "Gemini", label: { en: "Gemini", id: "Gemini" }},
  { id: "Firefly", label: { en: "Firefly", id: "Firefly" }},
  { id: "Leonardo AI", label: { en: "Leonardo AI", id: "Leonardo AI" }},
  { id: "Generic Image AI", label: { en: "Generic Image AI", id: "AI Gambar Umum" }}
];

export default function VeoPromptForm({ onSuccess }) {
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
    watch,
    setValue,
    getValues,
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
    
    // Convert underscores to proper case in field names for consistency
    if (isPro && advancedMode) {
      // Ensure all field names match what the backend expects
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
      // Debug log to verify all fields are being sent
      console.log('Sending form data to backend:', data);
      
      // Send request to backend
      const response = await api.post('/prompt/veo', data);
      
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
      console.error('Failed to create Veo prompt:', error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('prompts.error_message'),
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
        label={t(`video_prompt.${label || name}`)}
        error={errors[name]?.message}
      >
        <select
          id={name}
          className="w-full p-2 border rounded-md bg-background text-foreground dark:border-gray-700 custom-select"
          {...register(name, required ? { required: t('prompts.required') } : {})}
        >
          <option value="" className="bg-background text-foreground">{t('common.choose')} {t(`video_prompt.${label || name}`)}</option>
          {options && options.map((option) => (
            <option 
              key={option.id || option} 
              value={option.id || option}
              className="text-foreground bg-background"
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
        <h2 className="text-lg font-semibold mb-2">{t('tabs.video_prompt')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('common.create_prompt')}
        </p>
        {isPro && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="advanced-mode"
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
              <label htmlFor="advanced-mode" className="text-sm font-medium">
                {advancedMode ? t('prompts.advanced_mode') : t('prompts.basic_mode')} (Pro)
              </label>
            </div>
            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">{t('common.pro_feature')}</span>
          </div>
        )}
      </div>
      
      {result ? (
        <div className="space-y-4">
          <PromptResult result={result} type="veo" />
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
                name="scene"
                label={t('video_prompt.subject')}
                error={errors.scene?.message}
              >
                <Input
                  id="scene"
                  placeholder={t('video_prompt.subject_placeholder')}
                  {...register("scene", { required: t('prompts.required') })}
                />
              </FormField>
              
              <FormField
                name="setting"
                label={t('video_prompt.background')}
                error={errors.setting?.message}
              >
                <Input
                  id="setting"
                  placeholder={t('video_prompt.background')}
                  {...register("setting")}
                />
              </FormField>
              
              <FormField
                name="mood"
                label={t('video_prompt.mood')}
                error={errors.mood?.message}
              >
                <Input
                  id="mood"
                  placeholder={t('video_prompt.mood_placeholder')}
                  {...register("mood")}
                />
              </FormField>
              
              <FormField
                name="music"
                label={t('video_prompt.music')}
                error={errors.music?.message}
              >
                <Input
                  id="music"
                  placeholder={t('video_prompt.music_placeholder')}
                  {...register("music")}
                />
              </FormField>
              
              <FormField
                name="action"
                label={t('video_prompt.motion')}
                error={errors.action?.message}
              >
                <Input
                  id="action"
                  placeholder={t('video_prompt.motion')}
                  {...register("action", { required: t('prompts.required') })}
                />
              </FormField>
            </>
          ) : (
            /* Advanced Form Fields (Pro Users Only) */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Style Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-1">{t('video_prompt.visualStyle')}</h3>
                  {renderSelect("visualStyle", "visualStyle", visualStyles, true)}
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-1">{t('video_prompt.video_format')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      name="duration"
                      label={t('video_prompt.duration_sec')}
                      error={errors.duration?.message}
                    >
                      <Input
                        id="duration"
                        type="number"
                        min="5"
                        max="60"
                        placeholder="10"
                        {...register("duration")}
                      />
                    </FormField>
                    {renderSelect("aspectRatio", "aspectRatio", aspectRatios)}
                    {renderSelect("frameRate", "frameRate", frameRates)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Cinematography */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-1">{t('video_prompt.cinematography')}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {renderSelect("cameraMovement", "cameraMovement", cameraMovements)}
                    {renderSelect("cameraAngle", "cameraAngle", cameraAngles)}
                    {renderSelect("lensType", "lensType", lensTypes)}
                    {renderSelect("depthOfField", "depthOfField", depthOfFields)}
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="font-medium text-sm border-b pb-1">{t('video_prompt.ai_platform')}</h3>
                    <div className="grid grid-cols-1 gap-4 mt-2">
                      {renderSelect("aiPlatform", "ai_platform", videoAiPlatforms)}
                    </div>
                  </div>
                </div>

                {/* Subject & Environment */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm border-b pb-1">{t('video_prompt.subject_environment')}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {renderSelect("subject", "subject", subjects)}
                    {renderSelect("timeOfDay", "timeOfDay", timeOfDay)}
                    {renderSelect("weather", "weather", weather)}
                  </div>
                </div>
              </div>
              
              {/* Character Customization (Pro Feature) */}
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium border-b pb-1 flex items-center">
                  {t('video_prompt.character')}
                  <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full ml-2">{t('common.pro_feature')}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    {renderSelect("ethnicity", "ethnicity", ethnicities)}
                    {renderSelect("bodyShape", "body_shape", bodyShapes)}
                  </div>
                  <div>
                    {renderSelect("hairColor", "hair_color", hairColors)}
                    {renderSelect("hairLength", "hair_length", hairLengths)}
                  </div>
                  <div>
                    {renderSelect("skinTone", "skin_tone", skinTones)}
                    {renderSelect("clothing", "clothing", clothingStyles)}
                    {renderSelect("breastSize", "breast_size", breastSizes)}
                  </div>
                </div>
              </div>

              {/* Basic fields in advanced mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <FormField
                    name="scene"
                    label={t('video_prompt.scene_details')}
                    error={errors.scene?.message}
                  >
                    <Textarea
                      id="scene"
                      placeholder={t('video_prompt.scene_details_placeholder')}
                      className="min-h-[80px]"
                      {...register("scene", { required: t('prompts.required') })}
                    />
                  </FormField>
                </div>
                <div>
                  <FormField
                    name="action"
                    label={t('video_prompt.motion')}
                    error={errors.action?.message}
                  >
                    <Textarea
                      id="action"
                      placeholder={t('video_prompt.motion_placeholder')}
                      className="min-h-[80px]"
                      {...register("action", { required: t('prompts.required') })}
                    />
                  </FormField>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField
                  name="setting"
                  label={t('video_prompt.background')}
                  error={errors.setting?.message}
                >
                  <Input
                    id="setting"
                    placeholder={t('video_prompt.background_placeholder')}
                    {...register("setting")}
                  />
                </FormField>
                
                <FormField
                  name="mood"
                  label={t('video_prompt.mood')}
                  error={errors.mood?.message}
                >
                  <Input
                    id="mood"
                    placeholder={t('video_prompt.mood_placeholder')}
                    {...register("mood")}
                  />
                </FormField>
                
                <FormField
                  name="music"
                  label={t('video_prompt.music')}
                  error={errors.music?.message}
                >
                  <Input
                    id="music"
                    placeholder={t('video_prompt.music_placeholder')}
                    {...register("music")}
                  />
                </FormField>
              </div>
            </>
          )}

          {/* Dialog - Common for all users */}
          <FormField
            name="dialog"
            label={t('video_prompt.dialog')}
            error={errors.dialog?.message}
          >
            <Textarea
              id="dialog"
              placeholder={t('video_prompt.dialog_placeholder')}
              className="min-h-[100px]"
              {...register("dialog", { required: t('prompts.required') })}
            />
          </FormField>
          
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
