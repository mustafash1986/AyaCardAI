
// types for Quran API
export interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
}

export interface Verse {
  id: number;
  verse_key: string; // "1:1"
  text_uthmani: string;
}

export interface Edition {
  identifier: string; // e.g. "ar.muyassar"
  name: string;      // e.g. "King Fahad Quran Complex"
  englishName: string; // e.g. "Tafsir Al-Muyassar"
  language: string;
  type: string;      // "tafsir" or "translation"
}

const BASE_URL = 'https://api.quran.com/api/v4';

// Verified IDs from api.alquran.cloud
const FALLBACK_EDITIONS: Edition[] = [
  // Tafsirs
  { identifier: 'ar.muyassar', name: 'تفسير الميسر', englishName: 'Al-Muyassar', language: 'ar', type: 'tafsir' },
  { identifier: 'ar.jalalayn', name: 'تفسير الجلالين', englishName: 'Tafsir Al-Jalalayn', language: 'ar', type: 'tafsir' },
  { identifier: 'ar.ibnkathir', name: 'تفسير ابن كثير', englishName: 'Tafsir Ibn Kathir', language: 'ar', type: 'tafsir' },
  { identifier: 'ar.qurtubi', name: 'تفسير القرطبي', englishName: 'Tafsir Al-Qurtubi', language: 'ar', type: 'tafsir' },
  { identifier: 'ar.al-tabari', name: 'تفسير الطبري', englishName: 'Tafsir Al-Tabari', language: 'ar', type: 'tafsir' }, // Fixed ID
  { identifier: 'ar.baghawi', name: 'تفسير البغوي', englishName: 'Tafsir Al-Baghawi', language: 'ar', type: 'tafsir' },
  { identifier: 'ar.waseet', name: 'التفسير الوسيط', englishName: 'Al-Waseet', language: 'ar', type: 'tafsir' }, 
  
  // Translations - English
  { identifier: 'en.sahih', name: 'صحيح انترناشونال', englishName: 'Saheeh International', language: 'en', type: 'translation' },
  { identifier: 'en.yusufali', name: 'يوسف علي', englishName: 'Yusuf Ali', language: 'en', type: 'translation' },
  { identifier: 'en.pickthall', name: 'بيكتال', englishName: 'Pickthall', language: 'en', type: 'translation' },
  { identifier: 'en.asad', name: 'محمد أسد', englishName: 'Muhammad Asad', language: 'en', type: 'translation' },
  
  // Translations - Other
  { identifier: 'fr.hamidullah', name: 'حميد الله (فرنسي)', englishName: 'French (Hamidullah)', language: 'fr', type: 'translation' },
  { identifier: 'ur.jalandhry', name: 'جالندري (أردو)', englishName: 'Urdu (Jalandhry)', language: 'ur', type: 'translation' },
  { identifier: 'id.indonesian', name: 'الإندونيسية', englishName: 'Indonesian', language: 'id', type: 'translation' },
  { identifier: 'tr.diyanet', name: 'التركية', englishName: 'Turkish', language: 'tr', type: 'translation' },
];

export const getChapters = async (): Promise<Chapter[]> => {
  try {
    const response = await fetch(`${BASE_URL}/chapters`);
    const data = await response.json();
    return data.chapters || [];
  } catch (error) {
    console.error("Failed to fetch chapters", error);
    return [];
  }
};

export const getVerses = async (chapterId: number): Promise<Verse[]> => {
  try {
    // Fetch verses with Uthmani script
    const response = await fetch(`${BASE_URL}/quran/verses/uthmani?chapter_number=${chapterId}`);
    const data = await response.json();
    return data.verses || [];
  } catch (error) {
    console.error("Failed to fetch verses", error);
    return [];
  }
};

export const getEditions = async (): Promise<Edition[]> => {
  // We strictly use our curated fallback list because it contains the correct Arabic names
  // and verified IDs that work with our chosen API endpoints.
  // The global API list is too messy.
  return Promise.resolve(FALLBACK_EDITIONS);
};

export const getTafsir = async (verseKey: string, editionSlug: string = 'ar.muyassar'): Promise<string> => {
  // verseKey is "1:1"
  
  // Strategy: Al Quran Cloud (Primary - supports specific editions)
  try {
     const response = await fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/${editionSlug}`);
     if (response.ok) {
       const data = await response.json();
       if (data.data && data.data.text) {
         // Some Tafsirs return text with newlines or mixed content, clean it slightly if needed
         return data.data.text;
       }
     }
  } catch (error) {
    console.warn(`Al Quran Cloud API failed for ${editionSlug}`, error);
  }

  return "Could not load content for this edition. Please check internet connection or select a different source.";
};