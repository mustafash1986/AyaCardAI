export interface TextLayerState {
  content: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  align: 'left' | 'center' | 'right' | 'justify';
  bold: boolean;
  italic: boolean;
  offsetY: number; // Vertical nudge
  widthPercent: number;
  shadow: boolean;
  shadowColor: string;
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  bgPadding: number;
  bgRadius: number;
  direction?: 'rtl' | 'ltr';
}

export interface CardState {
  // Dimensions
  width: number;
  height: number;
  
  // Background
  backgroundColor: string;
  backgroundImage: string | null;
  overlayColor: string;
  overlayOpacity: number;

  // Layout / Frame
  padding: { top: number; right: number; bottom: number; left: number };
  border: {
    enabled: boolean;
    style: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
    color: string;
    width: number;
    opacity: number;
    radius: { tl: number; tr: number; bl: number; br: number };
  };

  // Content
  text1: TextLayerState; // Ayah
  text2: TextLayerState; // Tafseer Text
  text3: TextLayerState; // Primary Subtitle (Surah/Verse)
  text4: TextLayerState; // Secondary Subtitle (Tafseer Name)
  
  // Footer
  footer: {
    enabled: boolean;
    // Distinct fields for multiple socials
    socials: {
      telegram: string;
      twitter: string;
      instagram: string;
      facebook: string;
      whatsapp: string;
      linkedin: string;
      website: string;
    };
    showHijri: boolean;
    showGregorian: boolean;
    offsetY: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    divider: boolean;
  };
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  originalImage: string; // Base64
  generatedImage: string; // Base64
  prompt: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}