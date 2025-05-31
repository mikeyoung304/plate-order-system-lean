import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and merges Tailwind CSS classes intelligently
 * 
 * This utility function combines multiple class names and handles conflicts
 * by giving precedence to later classes. It's essential for conditional
 * styling in React components.
 * 
 * @param inputs - Variable number of class values (strings, conditionals, arrays)
 * @returns Merged class string with conflicts resolved
 * 
 * @example
 * ```tsx
 * // Basic usage
 * cn('px-4 py-2', 'bg-blue-500')
 * 
 * // With conditionals
 * cn('base-class', isActive && 'active-class', { 'error': hasError })
 * 
 * // Conflict resolution (py-4 wins over py-2)
 * cn('px-4 py-2', 'py-4 text-white') // Result: 'px-4 py-4 text-white'
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
