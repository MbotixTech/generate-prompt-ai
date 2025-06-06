const User = require('../models/user.model');
const Prompt = require('../models/prompt.model');
const { generatePrompt } = require('../utils/aiService');
const { translateText } = require('../utils/translator');

// Create Veo 3 prompt
exports.createVeoPrompt = async (req, res) => {
  try {
    console.log('Received VEO prompt data:', req.body);
    
    // Normalize field names first to handle any inconsistencies
    const normalizedData = { ...req.body };
    
    // Check for and fix underscore field names
    const fieldMappings = {
      'body_shape': 'bodyShape',
      'hair_color': 'hairColor',
      'hair_length': 'hairLength',
      'skin_tone': 'skinTone',
      'breast_size': 'breastSize'
    };
    
    Object.entries(fieldMappings).forEach(([oldField, newField]) => {
      if (normalizedData[oldField] !== undefined) {
        normalizedData[newField] = normalizedData[oldField];
        delete normalizedData[oldField];
      }
    });
    
    // Now destructure with normalized field names
    const { 
      // Basic fields
      scene, 
      setting, 
      mood, 
      music, 
      action, 
      dialog,
      // Pro user fields
      visualStyle,
      duration,
      aspectRatio,
      frameRate,
      cameraMovement,
      cameraAngle,
      lensType,
      depthOfField,
      subject,
      clothing,
      timeOfDay,
      weather,
      // AI platform selection
      aiPlatform,
      // Character customization options
      ethnicity,
      bodyShape,
      hairColor,
      hairLength,
      skinTone,
      breastSize
    } = normalizedData;
    
    const userId = req.user._id;
    const isPro = req.user.role === 'pro' || req.user.role === 'admin';
    
    // Check for required fields
    if (!scene || !dialog) {
      return res.status(400).json({ message: 'Scene dan dialog wajib diisi.' });
    }
    
    // Fields to translate - always include all available fields regardless of user type
    const fieldsToTranslate = { scene, action, dialog };
    
    // Add basic fields if they exist
    if (setting) fieldsToTranslate.setting = setting;
    if (mood) fieldsToTranslate.mood = mood;
    if (music) fieldsToTranslate.music = music;
    
    // Add pro fields if they exist - now we always include them regardless of user type
    // Video settings fields
    if (visualStyle) fieldsToTranslate.visualStyle = visualStyle;
    if (duration) fieldsToTranslate.duration = duration;
    if (aspectRatio) fieldsToTranslate.aspectRatio = aspectRatio;
    if (frameRate) fieldsToTranslate.frameRate = frameRate;
    if (cameraMovement) fieldsToTranslate.cameraMovement = cameraMovement;
    if (cameraAngle) fieldsToTranslate.cameraAngle = cameraAngle;
    if (lensType) fieldsToTranslate.lensType = lensType;
    if (depthOfField) fieldsToTranslate.depthOfField = depthOfField;
    if (subject) fieldsToTranslate.subject = subject;
    if (clothing) fieldsToTranslate.clothing = clothing;
    if (timeOfDay) fieldsToTranslate.timeOfDay = timeOfDay;
    if (weather) fieldsToTranslate.weather = weather;
    
    // AI platform selection
    if (aiPlatform) fieldsToTranslate.aiPlatform = aiPlatform;
    
    // Character customization fields
    if (ethnicity) fieldsToTranslate.ethnicity = ethnicity;
    if (bodyShape) fieldsToTranslate.bodyShape = bodyShape;
    if (hairColor) fieldsToTranslate.hairColor = hairColor;
    if (hairLength) fieldsToTranslate.hairLength = hairLength;
    if (skinTone) fieldsToTranslate.skinTone = skinTone;
    if (breastSize) fieldsToTranslate.breastSize = breastSize;
    
    // Original fields (keep all fields as received) - map to ensure consistent naming
    const originalFields = { ...req.body };

    // Ensure field names are consistent for all platforms
    if (originalFields.body_shape) {
      originalFields.bodyShape = originalFields.body_shape;
      delete originalFields.body_shape;
    }
    if (originalFields.hair_color) {
      originalFields.hairColor = originalFields.hair_color;
      delete originalFields.hair_color;
    } 
    if (originalFields.hair_length) {
      originalFields.hairLength = originalFields.hair_length;
      delete originalFields.hair_length;
    }
    if (originalFields.skin_tone) {
      originalFields.skinTone = originalFields.skin_tone;
      delete originalFields.skin_tone;
    }
    if (originalFields.breast_size) {
      originalFields.breastSize = originalFields.breast_size;
      delete originalFields.breast_size;
    }
    
    // Translated fields - start with a copy of original fields
    const translatedFields = { ...originalFields };
    
    // Perform translations (all fields except dialog)
    const translationPromises = Object.entries(fieldsToTranslate)
      .filter(([key]) => key !== 'dialog') // Don't translate dialog
      .map(async ([key, value]) => {
        if (value) {
          try {
            translatedFields[key] = await translateText(value, 'id', 'en');
            return { key, translated: translatedFields[key] };
          } catch (error) {
            console.error(`Translation error for field ${key}:`, error.message);
            // Keep original text if translation fails
            translatedFields[key] = value;
            return { key, translated: value, error: error.message };
          }
        }
        return { key, translated: translatedFields[key] };
      });
    
    await Promise.all(translationPromises);
    
    // Generate AI prompt
    const aiResult = await generatePrompt('veo', translatedFields, isPro);
    
    // Save prompt to database
    const newPrompt = new Prompt({
      userId,
      type: 'veo',
      originalFields,
      translatedFields,
      aiResult
    });
    
    await newPrompt.save();
    
    // Update user's prompt count
    if (req.user.role === 'free') {
      await User.findByIdAndUpdate(userId, { $inc: { promptsToday: 1 } });
    }
    
    res.status(201).json({
      message: 'Prompt Video berhasil dibuat.',
      prompt: newPrompt
    });
  } catch (error) {
    console.error('Create Veo prompt error:', error);
    res.status(500).json({ message: 'Kesalahan server saat membuat prompt.' });
  }
};

// Create Image prompt
exports.createImagePrompt = async (req, res) => {
  try {
    console.log('Received IMAGE prompt data:', req.body);
    
    // Normalize field names first to handle any inconsistencies
    const normalizedData = { ...req.body };
    
    // Check for and fix underscore field names
    const fieldMappings = {
      'body_shape': 'bodyShape',
      'hair_color': 'hairColor',
      'hair_length': 'hairLength',
      'skin_tone': 'skinTone',
      'breast_size': 'breastSize',
      'color_tone': 'colorTone'
    };
    
    Object.entries(fieldMappings).forEach(([oldField, newField]) => {
      if (normalizedData[oldField] !== undefined) {
        normalizedData[newField] = normalizedData[oldField];
        delete normalizedData[oldField];
      }
    });
    
    const { 
      subject, 
      style, 
      environment, 
      lighting, 
      colorTone, 
      cameraAngle, 
      additionalDetails, 
      exclude,
      // Pro fields
      aiPlatform,
      ethnicity,
      bodyShape,
      hairColor,
      hairLength,
      skinTone,
      clothing,
      breastSize
    } = normalizedData;
    const userId = req.user._id;
    const isPro = req.user.role === 'pro' || req.user.role === 'admin';
    
    // Check for required fields
    if (!subject || !style || !environment || !lighting || !colorTone || !additionalDetails) {
      return res.status(400).json({ message: 'Field wajib belum diisi.' });
    }
    
    // Create fields to translate - always include all available fields
    const fieldsToTranslate = {
      subject,
      style,
      environment,
      lighting,
      colorTone,
      additionalDetails
    };
    
    if (cameraAngle) fieldsToTranslate.cameraAngle = cameraAngle;
    if (exclude) fieldsToTranslate.exclude = exclude;
    
    // Add all additional fields if they exist, regardless of user type
    if (aiPlatform) fieldsToTranslate.aiPlatform = aiPlatform;
    if (ethnicity) fieldsToTranslate.ethnicity = ethnicity;
    if (bodyShape) fieldsToTranslate.bodyShape = bodyShape;
    if (hairColor) fieldsToTranslate.hairColor = hairColor;
    if (hairLength) fieldsToTranslate.hairLength = hairLength;
    if (skinTone) fieldsToTranslate.skinTone = skinTone;
    if (clothing) fieldsToTranslate.clothing = clothing;
    if (breastSize) fieldsToTranslate.breastSize = breastSize;
    
    // Original fields (keep all fields as received) - map to ensure consistent naming
    const originalFields = { ...req.body };
    
    // Ensure field names are consistent for all platforms
    if (originalFields.body_shape) {
      originalFields.bodyShape = originalFields.body_shape;
      delete originalFields.body_shape;
    }
    if (originalFields.hair_color) {
      originalFields.hairColor = originalFields.hair_color;
      delete originalFields.hair_color;
    } 
    if (originalFields.hair_length) {
      originalFields.hairLength = originalFields.hair_length;
      delete originalFields.hair_length;
    }
    if (originalFields.skin_tone) {
      originalFields.skinTone = originalFields.skin_tone;
      delete originalFields.skin_tone;
    }
    if (originalFields.breast_size) {
      originalFields.breastSize = originalFields.breast_size;
      delete originalFields.breast_size;
    }
    
    // Translated fields - start with a copy of original fields
    const translatedFields = { ...originalFields };
    
    // Perform translations with better error handling
    const translationPromises = Object.entries(fieldsToTranslate)
      .map(async ([key, value]) => {
        if (value) {
          try {
            translatedFields[key] = await translateText(value, 'id', 'en');
            return { key, translated: translatedFields[key] };
          } catch (error) {
            console.error(`Translation error for field ${key}:`, error.message);
            // Keep original text if translation fails
            translatedFields[key] = value;
            return { key, translated: value, error: error.message };
          }
        }
        return { key, translated: translatedFields[key] };
      });
    
    await Promise.all(translationPromises);
    
    // Generate AI prompt - pass isPro flag to ensure proper formatting
    const aiResult = await generatePrompt('image', translatedFields, isPro);
    
    // Save prompt to database
    const newPrompt = new Prompt({
      userId,
      type: 'image',
      originalFields,
      translatedFields,
      aiResult
    });
    
    await newPrompt.save();
    
    // Update user's prompt count
    if (req.user.role === 'free') {
      await User.findByIdAndUpdate(userId, { $inc: { promptsToday: 1 } });
    }
    
    res.status(201).json({
      message: 'Prompt Image berhasil dibuat.',
      prompt: newPrompt
    });
  } catch (error) {
    console.error('Create Image prompt error:', error);
    res.status(500).json({ message: 'Kesalahan server saat membuat prompt.' });
  }
};

// Get prompt history for a user
exports.getPromptHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type } = req.query;
    
    // Prepare filter
    const filter = { userId };
    
    // Add type filter if provided
    if (type && (type === 'veo' || type === 'image')) {
      filter.type = type;
    }
    
    // Convert page and limit to integers
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;
    
    // Get prompts with pagination
    const prompts = await Prompt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitInt);
    
    // Get total count for pagination
    const total = await Prompt.countDocuments(filter);
    
    res.status(200).json({
      prompts,
      pagination: {
        page: pageInt,
        limit: limitInt,
        total,
        pages: Math.ceil(total / limitInt)
      }
    });
  } catch (error) {
    console.error('Get prompt history error:', error);
    res.status(500).json({ message: 'Kesalahan server saat mengambil riwayat prompt.' });
  }
};
