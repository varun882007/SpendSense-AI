import {
  Utensils,
  ShoppingBag,
  Plane,
  Car,
  BookOpen,
  HeartPulse,
  Tv,
  FileText,
  Home,
  Repeat,
  Briefcase,
  Laptop,
  MoreHorizontal,
} from 'lucide-react';

export const categoryIcons = {
  Food: Utensils,
  Shopping: ShoppingBag,
  Travel: Plane,
  Transportation: Car,
  Education: BookOpen,
  Healthcare: HeartPulse,
  Entertainment: Tv,
  Bills: FileText,
  Rent: Home,
  Subscriptions: Repeat,
  Salary: Briefcase,
  Freelance: Laptop,
  Other: MoreHorizontal,
};

export function getCategoryIcon(name) {
  return categoryIcons[name] || MoreHorizontal;
}
