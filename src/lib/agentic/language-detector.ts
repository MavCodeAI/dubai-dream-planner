// Language Detection and Auto-Response System
// Detects user language and responds in the same language automatically

export type DetectedLanguage = 'urdu' | 'english' | 'mixed' | 'unknown';

export interface LanguageContext {
  detectedLanguage: DetectedLanguage;
  confidence: number;
  responseLanguage: 'urdu' | 'english';
  writingStyle: 'formal' | 'casual' | 'mixed';
}

export class LanguageDetector {
  private urduKeywords = [
    'میں', 'آپ', 'ہے', 'ہیں', 'کرنا', 'چاہتا', 'جانا', 'دبئی', 'اگر', 'لیکن', 'کیونکہ',
    'کون', 'کب', 'کہاں', 'کیسے', 'کتنا', 'کتنے', 'بات', 'سوال', 'جواب', 'مدد',
    'شکریہ', 'معاف', 'السلام', 'خدا حافظ', 'پر', 'پر', 'سے', 'کو', 'کا', 'کی'
  ];

  private urduScriptPattern = /[\u0600-\u06FF]/;
  private englishPattern = /^[a-zA-Z\s\d\W]+$/;

  detectLanguage(text: string): LanguageContext {
    const cleanText = text.trim().toLowerCase();
    
    // Check for Urdu script characters
    const hasUrduScript = this.urduScriptPattern.test(text);
    const urduWordCount = this.countUrduWords(cleanText);
    const englishWordCount = this.countEnglishWords(cleanText);
    const totalWords = urduWordCount + englishWordCount;

    // Calculate language ratios
    const urduRatio = totalWords > 0 ? urduWordCount / totalWords : 0;
    const englishRatio = totalWords > 0 ? englishWordCount / totalWords : 0;

    let detectedLanguage: DetectedLanguage;
    let confidence: number;

    if (hasUrduScript && urduRatio > 0.6) {
      detectedLanguage = 'urdu';
      confidence = Math.min(urduRatio + 0.2, 1);
    } else if (englishRatio > 0.8) {
      detectedLanguage = 'english';
      confidence = Math.min(englishRatio + 0.1, 1);
    } else if (urduRatio > 0.2 && englishRatio > 0.2) {
      detectedLanguage = 'mixed';
      confidence = 0.7;
    } else {
      detectedLanguage = 'unknown';
      confidence = 0.3;
    }

    // Determine response language (prefer Urdu if any Urdu detected)
    const responseLanguage = (hasUrduScript || urduRatio > 0.3) ? 'urdu' : 'english';

    // Detect writing style
    const writingStyle = this.detectWritingStyle(cleanText, detectedLanguage);

    return {
      detectedLanguage,
      confidence,
      responseLanguage,
      writingStyle
    };
  }

  private countUrduWords(text: string): number {
    const words = text.split(/\s+/);
    return words.filter(word => 
      this.urduScriptPattern.test(word) || 
      this.urduKeywords.some(keyword => word.includes(keyword))
    ).length;
  }

  private countEnglishWords(text: string): number {
    const words = text.split(/\s+/);
    return words.filter(word => 
      this.englishPattern.test(word) && 
      !this.urduScriptPattern.test(word)
    ).length;
  }

  private detectWritingStyle(text: string, language: DetectedLanguage): 'formal' | 'casual' | 'mixed' {
    const formalIndicators = {
      urdu: ['آپ', 'حضرت', 'محترم', 'جی', 'میں بہت شکریہ', 'برائے مہربانی'],
      english: ['please', 'thank you', 'would you', 'could you', 'sir', 'madam', 'formal']
    };

    const casualIndicators = {
      urdu: ['تو', 'تم', 'یار', 'بھائی', 'بس', 'arre', 'waah'],
      english: ['hey', 'yo', 'dude', 'bro', 'what\'s up', 'gonna', 'wanna', 'cool']
    };

    let formalScore = 0;
    let casualScore = 0;

    const formalWords = formalIndicators[language] || [];
    const casualWords = casualIndicators[language] || [];

    formalWords.forEach(indicator => {
      if (text.includes(indicator)) formalScore++;
    });

    casualWords.forEach(indicator => {
      if (text.includes(indicator)) casualScore++;
    });

    if (formalScore > casualScore) return 'formal';
    if (casualScore > formalScore) return 'casual';
    return 'mixed';
  }

  generateLanguageSpecificPrompt(
    basePrompt: string, 
    languageContext: LanguageContext,
    taskType: 'travel_intent' | 'itinerary' | 'question' | 'general'
  ): { systemPrompt: string; userPrompt: string } {
    const { responseLanguage, writingStyle } = languageContext;

    const languageInstructions = {
      urdu: {
        formal: {
          travel_intent: `
آپ ایک ماہر UAE ٹریول ایجنٹ ہیں۔ براہ کرم اردو میں جواب دیں۔
صارف کے پیغام سے ٹریول کا ارادہ extract کریں۔
ہمیشا JSON format میں جواب دیں۔
`,
          itinerary: `
آپ ایک تجربہ کار UAE ٹریول پلانر ہیں۔ براہ کرم اردو میں جواب دیں۔
ذاتی سفارشات بنائیں جو صارف کی ضروریات کو پورا کرتی ہوں۔
موسم، بجٹ، اور دلچسپیوں کو مدنظر رکھیں۔
`,
          question: `
آپ ایک جانکار UAE ٹریول گائیڈ ہیں۔ براہ کرم اردو میں جواب دیں۔
درست اور مددگار معلومات فراہم کریں۔
`,
          general: `
آپ ایک مددگار AI اسسٹنٹ ہیں۔ براہ کرم اردو میں جواب دیں۔
`
        },
        casual: {
          travel_intent: `
تم ایک UAE ٹریول ایکسپرٹ ہو۔ اردو میں آرام سے بات کریں۔
صارف کے پیغام سے سمجھو کہ کہاں جانا چاہتا ہے۔
JSON میں ڈیٹلز دیں۔
`,
          itinerary: `
تم ایک پروفیشنل ٹریول پلانر ہو۔ اردو میں دوستانہ طریقے سے بات کریں۔
بہترین سجیشنز دیں۔
`,
          question: `
تمہیں UAE کے بارے سب پتہ ہے۔ اردو میں آسانی سے جواب دو۔
`,
          general: `
تم ایک مددگار AI ہو۔ اردو میں بات کریں۔
`
        }
      },
      english: {
        formal: {
          travel_intent: `
You are a professional UAE travel agent. Please respond in formal English.
Extract travel intent from user messages accurately.
Always return responses in JSON format.
`,
          itinerary: `
You are an expert UAE travel planner. Please provide formal English responses.
Create personalized recommendations based on user needs.
Consider weather, budget, and interests.
`,
          question: `
You are a knowledgeable UAE travel guide. Please provide formal English responses.
Offer accurate and helpful information.
`,
          general: `
You are a helpful AI assistant. Please respond in formal English.
`
        },
        casual: {
          travel_intent: `
You're a UAE travel expert! Chat casually in English.
Figure out where the user wants to go.
Return details in JSON format.
`,
          itinerary: `
You're a pro travel planner! Keep it friendly and casual in English.
Give awesome suggestions.
`,
          question: `
You know all about UAE! Answer casually in English.
`,
          general: `
You're a helpful AI! Just chat naturally in English.
`
        }
      }
    };

    const systemPrompt = languageInstructions[responseLanguage][writingStyle][taskType];
    
    return {
      systemPrompt: systemPrompt + basePrompt,
      userPrompt: this.adaptUserPrompt(basePrompt, responseLanguage, writingStyle)
    };
  }

  private adaptUserPrompt(basePrompt: string, language: 'urdu' | 'english', style: 'formal' | 'casual' | 'mixed'): string {
    if (language === 'urdu') {
      return `براہ کرم اس پیغام کا جواب دیں: ${basePrompt}`;
    } else {
      return `Please respond to this message: ${basePrompt}`;
    }
  }

  formatResponse(response: string, languageContext: LanguageContext): string {
    const { responseLanguage, writingStyle } = languageContext;

    // Add appropriate greeting/closing based on language and style
    const greetings = {
      urdu: {
        formal: '',
        casual: ''
      },
      english: {
        formal: '',
        casual: ''
      }
    };

    const closings = {
      urdu: {
        formal: '\n\nآپ کی مدد کے لیے حاضر ہیں۔',
        casual: '\n\nاور کوئی سوال؟'
      },
      english: {
        formal: '\n\nI\'m here to help with your travel needs.',
        casual: '\n\nAny other questions?'
      }
    };

    // Format response based on detected language
    if (responseLanguage === 'urdu') {
      // Ensure Urdu text is properly formatted
      return response.trim();
    } else {
      // Ensure English text is properly formatted
      return response.trim();
    }
  }

  // Method to get language-specific error messages
  getErrorMessage(errorType: 'network' | 'parsing' | 'general', languageContext: LanguageContext): string {
    const { responseLanguage } = languageContext;

    const errorMessages = {
      urdu: {
        network: 'نیٹ ورک کی خرابی۔ براہ کرم دوبارہ کوشش کریں۔',
        parsing: 'جواب سمجھنے میں مسئلہ۔ براہ کرم دوبارہ کوشش کریں۔',
        general: 'کچھ غلطی ہو گئی۔ براہ کرم دوبارہ کوشش کریں۔'
      },
      english: {
        network: 'Network error. Please try again.',
        parsing: 'Had trouble understanding the response. Please try again.',
        general: 'Something went wrong. Please try again.'
      }
    };

    return errorMessages[responseLanguage][errorType];
  }

  // Method to get language-specific success messages
  getSuccessMessage(action: 'itinerary_generated' | 'intent_extracted' | 'question_answered', languageContext: LanguageContext): string {
    const { responseLanguage } = languageContext;

    const successMessages = {
      urdu: {
        itinerary_generated: 'آپ کا ٹریول پلن تیار ہو گیا ہے!',
        intent_extracted: 'سمجھ گیا! آپ کا منصوبہ بنایا جا رہا ہے۔',
        question_answered: 'یہ آپ کے سوال کا جواب ہے۔'
      },
      english: {
        itinerary_generated: 'Your travel plan has been created!',
        intent_extracted: 'Got it! Planning your trip now.',
        question_answered: 'Here\'s the answer to your question.'
      }
    };

    return successMessages[responseLanguage][action];
  }
}

// Singleton instance
export const languageDetector = new LanguageDetector();
