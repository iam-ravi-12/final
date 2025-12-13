/**
 * Utility functions for the app
 */

/**
 * Format member count with proper pluralization
 * @param count - Number of members
 * @returns Formatted string like "1 member" or "5 members"
 */
export const formatMemberCount = (count: number): string => {
  return `${count} ${count === 1 ? 'member' : 'members'}`;
};

/**
 * Format date relative to now
 * @param dateString - ISO date string
 * @returns Formatted string like "Just now", "5m ago", etc.
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Copy text to clipboard with fallback for different platforms
 * @param text - Text to copy
 * @returns Promise that resolves when copied successfully
 * 
 * Note: Uses deprecated document.execCommand as fallback for older browsers
 * that don't support the modern Clipboard API. This is intentional for
 * maximum compatibility.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  // Try modern clipboard API first
  if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
  }
  
  // Fallback for browsers that don't support clipboard API
  // Uses deprecated execCommand for maximum compatibility
  if (typeof document !== 'undefined') {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
    } catch (err) {
      textArea.remove();
      throw new Error('Failed to copy to clipboard');
    }
  } else {
    throw new Error('Clipboard not available on this platform');
  }
};
