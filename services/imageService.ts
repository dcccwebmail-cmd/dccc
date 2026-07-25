/**
 * Image processing service for client-side image compression and format conversion.
 */

/**
 * Compresses any input image and converts it into a highly optimized WebP format.
 * Replaces the original extension with `.webp` and reduces size using HTML5 Canvas.
 * Supports transparency for PNGs and transparent assets.
 * 
 * @param file The original image File object
 * @param maxWidth The maximum width constraint for the compressed image (default: 1200px)
 * @param quality Compression quality between 0 and 1 (default: 0.8)
 */
export const compressImageToWebP = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If the file is not an image, resolve with original
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        // Scale down if it exceeds maximum width
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Clear rect and draw image (maintains alpha channel for webp/png)
        ctx?.clearRect(0, 0, width, height);
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image: Canvas export returned null'));
            return;
          }
          
          // Re-generate file name with .webp extension
          let newName = file.name;
          const lastDotIdx = newName.lastIndexOf('.');
          if (lastDotIdx !== -1) {
            newName = newName.substring(0, lastDotIdx) + '.webp';
          } else {
            newName = newName + '.webp';
          }
          
          const compressedFile = new File([blob], newName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        }, 'image/webp', quality);
      };
      
      img.onerror = (err) => {
        console.error('Image element load error:', err);
        reject(new Error('Failed to load image for compression'));
      };
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Failed to read image file'));
    };
  });
};
