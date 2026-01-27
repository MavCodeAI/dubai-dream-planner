import { 
  Building2, 
  Landmark, 
  BookOpen, 
  Palmtree, 
  Mountain, 
  Waves, 
  Anchor,
  User,
  Heart,
  Users,
  ShoppingBag,
  Utensils,
  Camera,
  Moon,
  HelpCircle,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Building2,
  Landmark,
  BookOpen,
  Palmtree,
  Mountain,
  Waves,
  Anchor,
  User,
  Heart,
  Users,
  ShoppingBag,
  Utensils,
  Camera,
  Moon,
  HelpCircle,
};

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon = iconMap[name];
  
  // Return fallback icon if not found
  const FallbackIcon = iconMap['HelpCircle'];
  
  if (!Icon) {
    return <FallbackIcon className={className} />;
  }
  
  return <Icon className={className} />;
}
