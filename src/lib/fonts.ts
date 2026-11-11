export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'sans' | 'serif' | 'display' | 'handwriting' | 'mono';
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Sans-Serif
  { id: 'inter', name: 'Inter (Modern Sans)', family: "'Inter', sans-serif", category: 'sans' },
  { id: 'poppins', name: 'Poppins (Geometric)', family: "'Poppins', sans-serif", category: 'sans' },
  { id: 'montserrat', name: 'Montserrat (Clean Pro)', family: "'Montserrat', sans-serif", category: 'sans' },
  { id: 'oswald', name: 'Oswald (Condensed Impact)', family: "'Oswald', sans-serif", category: 'display' },
  
  // Serif & Luxury
  { id: 'playfair', name: 'Playfair Display (Luxury Serif)', family: "'Playfair Display', serif", category: 'serif' },
  { id: 'lora', name: 'Lora (Editorial Elegance)', family: "'Lora', serif", category: 'serif' },
  { id: 'cinzel', name: 'Cinzel (Classical Regal)', family: "'Cinzel', serif", category: 'serif' },
  { id: 'georgia', name: 'Georgia (Classic Book)', family: 'Georgia, serif', category: 'serif' },

  // Handwriting & Script
  { id: 'great-vibes', name: 'Great Vibes (Formal Calligraphy)', family: "'Great Vibes', cursive", category: 'handwriting' },
  { id: 'pacifico', name: 'Pacifico (Casual Brush)', family: "'Pacifico', cursive", category: 'handwriting' },
  { id: 'dancing-script', name: 'Dancing Script (Playful Script)', family: "'Dancing Script', cursive", category: 'handwriting' },
  { id: 'caveat', name: 'Caveat (Natural Handwritten)', family: "'Caveat', cursive", category: 'handwriting' },

  // Monospace & Technical
  { id: 'roboto-mono', name: 'Roboto Mono (Modern Code)', family: "'Roboto Mono', monospace", category: 'mono' },
  { id: 'courier-new', name: 'Courier New (Typewriter)', family: "'Courier New', monospace", category: 'mono' },
];

export function getFontFamilyCss(fontIdOrName?: string): string {
  if (!fontIdOrName) return "'Inter', sans-serif";
  const match = AVAILABLE_FONTS.find(
    (f) => f.id.toLowerCase() === fontIdOrName.toLowerCase() || f.name.toLowerCase() === fontIdOrName.toLowerCase()
  );
  if (match) return match.family;
  
  // Backward compatibility with legacy 'sans' | 'serif' | 'mono' | 'handwriting'
  if (fontIdOrName === 'sans') return "'Inter', sans-serif";
  if (fontIdOrName === 'serif') return "'Playfair Display', Georgia, serif";
  if (fontIdOrName === 'mono') return "'Roboto Mono', monospace";
  if (fontIdOrName === 'handwriting') return "'Great Vibes', cursive";

  return fontIdOrName;
}

