export interface DarkNatureSceneItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  fallbackGradient: string;
}

export const DARK_NATURE_SCENES: DarkNatureSceneItem[] = [
  {
    id: "alpine-mist",
    title: "Misty Alpine Forest",
    subtitle: "Deep Evergreen Canopy & Mountain Mist",
    url: "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1920&auto=format&fit=crop",
    fallbackGradient: "radial-gradient(ellipse at 50% 90%, #0d2818 0%, #071a10 40%, #030d07 70%, #010402 100%)",
  },
  {
    id: "foggy-woods",
    title: "Moody Foggy Woods",
    subtitle: "Nocturnal Birch & Ethereal Haze",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop",
    fallbackGradient: "radial-gradient(ellipse at 40% 70%, #082316 0%, #05140d 45%, #020704 100%)",
  },
  {
    id: "redwood-mist",
    title: "Deep Redwood Evergreen Mist",
    subtitle: "Ancient Giants & Bioluminescent Moss",
    url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1920&auto=format&fit=crop",
    fallbackGradient: "radial-gradient(ellipse at 60% 80%, #0b331f 0%, #061e12 50%, #020805 100%)",
  },
  {
    id: "mountain-lake",
    title: "Midnight Mountain Lake",
    subtitle: "Still Waters Under Starlit Pines",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop",
    fallbackGradient: "radial-gradient(ellipse at 50% 100%, #0e291f 0%, #081a13 45%, #020705 100%)",
  },
  {
    id: "wilderness-glade",
    title: "Mystic Wilderness Glade",
    subtitle: "Emerald Canopy & Floating Fireflies",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920&auto=format&fit=crop",
    fallbackGradient: "radial-gradient(ellipse at 30% 60%, #103824 0%, #071910 50%, #010503 100%)",
  },
  {
    id: "pine-ridge",
    title: "Dark Alpine Pine Ridge",
    subtitle: "Highland Conifers & Twilight Mist",
    url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=1920&auto=format&fit=crop",
    fallbackGradient: "radial-gradient(ellipse at 50% 85%, #0d301c 0%, #06170d 50%, #010402 100%)",
  },
];
