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
};

interface DynamicIconProps {
  name: string;
  className?: string;
}

export function DynamicIcon({ name, className }: DynamicIconProps) {
  const Icon = iconMap[name];
  
  if (!Icon) {
    return <div className={className} />;
  }
  
  return <Icon className={className} />;
}
