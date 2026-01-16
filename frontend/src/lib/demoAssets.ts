// Demo assets configuration and detection
export interface DemoAssets {
  wardrobe: string | null;
  chatbot: string[]; // length 1–3
  tryon: string | null;
  suggestions: string | null;
  hasAllCore: boolean; // wardrobe && chatbot.length && tryon && suggestions
}

// Client-side asset paths (assume they exist, let Image component handle 404s gracefully)
const CLIENT_ASSETS: DemoAssets = {
  wardrobe: '/demo/wardrobe.webp',
  chatbot: [
    '/demo/chatbot_1.webp',
    '/demo/chatbot_2.webp',
    '/demo/chatbot_3.webp'
  ],
  tryon: '/demo/tryon.webp',
  suggestions: '/demo/suggestions.webp',
  hasAllCore: true
};

// Server-side asset detection (for build-time optimization)
export async function getDemoAssets(): Promise<DemoAssets> {
  if (typeof window === 'undefined') {
    // Server-side: check file existence
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const publicDemoDir = path.join(process.cwd(), 'public/demo');
      const assets: DemoAssets = {
        wardrobe: null,
        chatbot: [],
        tryon: null,
        suggestions: null,
        hasAllCore: false
      };
      
      // Check each asset
      const assetChecks = [
        { path: 'wardrobe.webp', key: 'wardrobe' as keyof DemoAssets },
        { path: 'tryon.webp', key: 'tryon' as keyof DemoAssets },
        { path: 'suggestions.webp', key: 'suggestions' as keyof DemoAssets }
      ];
      
      for (const { path: assetPath, key } of assetChecks) {
        try {
          await fs.access(path.join(publicDemoDir, assetPath));
          assets[key] = `/demo/${assetPath}`;
        } catch {
          // Asset not found
        }
      }
      
      // Check chatbot assets
      for (let i = 1; i <= 3; i++) {
        try {
          await fs.access(path.join(publicDemoDir, `chatbot_${i}.webp`));
          assets.chatbot.push(`/demo/chatbot_${i}.webp`);
        } catch {
          // Asset not found
        }
      }
      
      assets.hasAllCore = !!(assets.wardrobe && assets.chatbot.length && assets.tryon && assets.suggestions);
      return assets;
      
    } catch (error) {
      return CLIENT_ASSETS; // Fallback to client assets
    }
  }
  
  // Client-side: return static paths
  return CLIENT_ASSETS;
}

// Client-side asset availability check
let hasDemoAssets: boolean | null = null;

export async function checkDemoAssets(): Promise<boolean> {
  if (hasDemoAssets !== null) {
    return hasDemoAssets;
  }
  
  try {
    const response = await fetch('/demo/wardrobe.webp', { method: 'HEAD' });
    hasDemoAssets = response.ok;
  } catch {
    hasDemoAssets = false;
  }
  
  return hasDemoAssets;
}

// Export for immediate use
export const HAS_DEMO_ASSETS = typeof window !== 'undefined' ? null : true; // Will be updated on first mount
