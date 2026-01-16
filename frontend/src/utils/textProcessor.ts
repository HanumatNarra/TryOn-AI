interface WardrobeItem {
  id: string;
  item_name: string;
  description: string;
  category: string;
  image_url: string;
  date_added: string;
}

interface ProcessedTextSegment {
  type: 'text' | 'wardrobe-item';
  content: string;
  item?: WardrobeItem;
}

interface MatchPosition {
  item: WardrobeItem;
  startIndex: number;
  endIndex: number;
  priority: number; // Higher priority for longer/more specific matches
}

/**
 * Processes AI response text to identify and mark wardrobe items for linking
 * Uses a production-grade algorithm that finds ALL wardrobe items mentioned
 */
export const processTextForWardrobeItems = (
  text: string,
  wardrobeItems: WardrobeItem[]
): ProcessedTextSegment[] => {
  if (!wardrobeItems.length) {
    return [{ type: 'text', content: text }];
  }

  // Step 1: Find all potential matches with their positions
  const matches: MatchPosition[] = [];
  const textLower = text.toLowerCase();

  for (const item of wardrobeItems) {
    const itemName = item.item_name;
    const itemNameLower = itemName.toLowerCase();
    
    // Find all occurrences of this item name in the text
    let startIndex = 0;
    while (true) {
      const index = textLower.indexOf(itemNameLower, startIndex);
      if (index === -1) break;

      // Check if this is a valid word boundary match
      const beforeChar = index > 0 ? text[index - 1] : ' ';
      const afterChar = index + itemName.length < text.length ? text[index + itemName.length] : ' ';
      
      // More flexible word boundary detection
      const isWordBoundary = (
        /\s|[.,!?;:()]/.test(beforeChar) || 
        index === 0 || 
        /\s|[.,!?;:()]/.test(afterChar) || 
        index + itemName.length === text.length
      );

      if (isWordBoundary) {
        // Calculate priority: longer names get higher priority
        const priority = itemName.length + (itemName.includes(' ') ? 10 : 0); // Bonus for multi-word items
        
        matches.push({
          item,
          startIndex: index,
          endIndex: index + itemName.length,
          priority
        });
      }
      
      startIndex = index + 1;
    }
  }

  // Step 2: Sort matches by priority (highest first) and resolve overlaps
  matches.sort((a, b) => b.priority - a.priority);
  
  const resolvedMatches: MatchPosition[] = [];
  const usedPositions = new Set<string>();

  for (const match of matches) {
    // Check if this position overlaps with any already used position
    let hasOverlap = false;
    for (let i = match.startIndex; i < match.endIndex; i++) {
      if (usedPositions.has(i.toString())) {
        hasOverlap = true;
        break;
      }
    }

    if (!hasOverlap) {
      resolvedMatches.push(match);
      // Mark all positions in this match as used
      for (let i = match.startIndex; i < match.endIndex; i++) {
        usedPositions.add(i.toString());
      }
    }
  }

  // Step 3: Sort resolved matches by position in text
  resolvedMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Step 4: Build segments from the original text
  const segments: ProcessedTextSegment[] = [];
  let currentIndex = 0;

  for (const match of resolvedMatches) {
    // Add text before the match
    if (match.startIndex > currentIndex) {
      segments.push({
        type: 'text',
        content: text.substring(currentIndex, match.startIndex)
      });
    }

    // Add the wardrobe item
    segments.push({
      type: 'wardrobe-item',
      content: text.substring(match.startIndex, match.endIndex),
      item: match.item
    });

    currentIndex = match.endIndex;
  }

  // Add any remaining text
  if (currentIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(currentIndex)
    });
  }

  // If no segments were created, return the original text
  if (segments.length === 0) {
    return [{ type: 'text', content: text }];
  }

  return segments;
};

/**
 * Calculates similarity between two strings using Levenshtein distance
 * Used for fuzzy matching when exact matches aren't found
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

/**
 * Levenshtein distance algorithm for string similarity
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};


