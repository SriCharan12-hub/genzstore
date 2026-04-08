/**
 * Utility to refresh product data and clear caches after purchases
 */

export const refreshProductCache = async () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
  
  try {
    // Clear browser cache by requesting with cache-busting timestamp
    const timestamp = Date.now();
    await fetch(`${API_URL}/api/products?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('✅ Product cache refreshed');
  } catch (error) {
    console.error('Error refreshing product cache:', error);
  }
};

export const refreshProductDetail = async (productId: string) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1000';
  
  try {
    // Refresh specific product detail
    const timestamp = Date.now();
    const response = await fetch(`${API_URL}/api/products/detail/${productId}?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (response.ok) {
      console.log('✅ Product detail refreshed');
      return await response.json();
    }
  } catch (error) {
    console.error('Error refreshing product detail:', error);
  }
};
