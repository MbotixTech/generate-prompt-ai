/**
 * Combines multiple class names into a single string
 * Used for combining Tailwind CSS classes with conditional ones
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
