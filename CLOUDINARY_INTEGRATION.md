# Cloudinary Image Upload Integration - Frontend

## Overview

The frontend has been updated to work seamlessly with the new **Cloudinary cloud storage backend**. Images are now uploaded directly to Cloudinary's CDN via the backend API, providing better performance, scalability, and reliability.

## What Changed

### 1. Updated API Functions (`src/services/api.js`)

#### `uploadImage(file, type)`
- **Enhanced with Cloudinary support**
- Added comprehensive validation (file size, type)
- Max file size: 10MB
- Allowed types: JPEG, PNG, GIF, WebP, SVG
- Primary endpoint: `/api/uploads/${type}`
- 30-second timeout for large uploads
- Better error handling and logging
- Fallback to Base64 data URLs if backend is unavailable (development only)

```javascript
import { uploadImage } from '../../services/api';

const response = await uploadImage(file, 'products');
const imageUrl = response.data.file.url; // Cloudinary URL
const publicId = response.data.file.publicId; // For deletion
```

#### `uploadMultipleImages(files, type)`
- **Enhanced with Cloudinary support**
- Validates each file before upload
- Primary endpoint: `/api/uploads/multiple/${type}`
- 60-second timeout for multiple uploads
- Returns array of Cloudinary URLs

```javascript
import { uploadMultipleImages } from '../../services/api';

const response = await uploadMultipleImages(files, 'products');
const urls = response.data.files.map(f => f.url);
```

#### `deleteImage(publicId)` - NEW!
- **New function for deleting images from Cloudinary**
- Accepts Cloudinary public ID or full URL
- Automatically extracts public ID from URL if needed

```javascript
import { deleteImage } from '../../services/api';

// Using public ID
await deleteImage('opdrape/products/1234567890-123456789');

// Using full Cloudinary URL (will extract public ID)
await deleteImage('https://res.cloudinary.com/.../opdrape/products/1234567890-123456789.jpg');
```

### 2. Enhanced Upload Component (`src/components/admin/AdminProductForm.js`)

#### `handleVariantImageUpload`
- **Updated with Cloudinary-specific handling**
- Shows "Uploading to Cloudinary..." toast notification
- Extracts Cloudinary URL and public ID from response
- Stores public ID for future deletion capability
- Warns if fallback Base64 mode is used
- Specific error messages for validation failures

**Features:**
- ✅ Real-time upload progress feedback
- ✅ Cloudinary URL verification
- ✅ Fallback mode detection
- ✅ Public ID storage for deletion
- ✅ Better error messages

## Response Formats

### Single Upload Response
```json
{
  "message": "File uploaded successfully",
  "file": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/opdrape/products/file.jpg",
    "publicId": "opdrape/products/1234567890-123456789",
    "filename": "1234567890-123456789",
    "originalname": "product.jpg",
    "mimetype": "image/jpeg",
    "size": 123456,
    "cloudinaryData": {
      "asset_id": "...",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "resource_type": "image",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Multiple Upload Response
```json
{
  "message": "Files uploaded successfully",
  "count": 3,
  "files": [
    {
      "url": "https://res.cloudinary.com/.../image1.jpg",
      "publicId": "opdrape/products/...",
      "filename": "...",
      "originalname": "image1.jpg",
      "mimetype": "image/jpeg",
      "size": 123456,
      "cloudinaryData": { ... }
    },
    // ... more files
  ]
}
```

### Delete Response
```json
{
  "message": "File deleted successfully",
  "result": {
    "result": "ok"
  }
}
```

## Upload Validation

### Client-side Validation (Frontend)
- **File Size**: Maximum 10MB per file
- **File Type**: Must be one of:
  - `image/jpeg` or `image/jpg`
  - `image/png`
  - `image/gif`
  - `image/webp`
  - `image/svg+xml`

### Error Messages
The frontend now shows specific error messages:
- ❌ File is too large. Maximum size is 10MB
- ❌ Invalid file type. Only JPEG, PNG, GIF, WebP, SVG allowed
- ❌ Invalid file provided
- ⚠️ Image uploaded using fallback mode (when backend is unavailable)

## Upload Types/Folders

Images are organized into Cloudinary folders based on the `type` parameter:

| Type | Cloudinary Folder | Usage |
|------|-------------------|-------|
| `products` | `opdrape/products` | Product images |
| `users` | `opdrape/users` | User profile pictures |
| `reviews` | `opdrape/reviews` | Review images |
| `categories` | `opdrape/categories` | Category images |

## Features

### 1. Automatic Image Optimization
Cloudinary automatically:
- Converts to optimal format (WebP, AVIF)
- Compresses for quality vs size
- Generates responsive sizes

### 2. Image Transformations
Transform images on-the-fly via URL parameters:
```
https://res.cloudinary.com/.../w_400,h_300,c_fill/image.jpg
```
- `w_400` - Width 400px
- `h_300` - Height 300px
- `c_fill` - Crop to fill
- [More transformations](https://cloudinary.com/documentation/image_transformation_reference)

### 3. CDN Delivery
All images served via Cloudinary's global CDN for:
- Fast worldwide delivery
- Reduced server load
- Better user experience

### 4. Fallback Mode
If the backend is unavailable, the frontend automatically:
- Converts images to Base64 data URLs
- Shows warning notification
- Allows continued development
- **Note**: Not recommended for production!

## Migration Guide

### No Changes Required For:
- ✅ Existing upload UI components
- ✅ Image display components
- ✅ Database schema (still stores URLs as strings)

### Components Using Uploads
The following components automatically use Cloudinary:

1. **AdminProductForm.js**
   - Product variant image uploads
   - Already updated with Cloudinary handling

2. **ProductImageUploader.js**
   - Bulk image uploads
   - Compatible with Cloudinary response format

### Backward Compatibility
The system accepts both URL formats:
- Old local URLs: `/uploads/products/12345.jpg`
- New Cloudinary URLs: `https://res.cloudinary.com/.../12345.jpg`

## Example Usage

### Single File Upload
```javascript
import { uploadImage } from '../../services/api';
import { toast } from 'react-toastify';

const handleFileUpload = async (file) => {
  try {
    // Show progress
    const toastId = toast.info('Uploading to Cloudinary...', { autoClose: false });
    
    // Upload to Cloudinary
    const response = await uploadImage(file, 'products');
    
    // Dismiss progress toast
    toast.dismiss(toastId);
    
    // Get Cloudinary URL and public ID
    const imageUrl = response.data.file.url;
    const publicId = response.data.file.publicId;
    
    
    // Store in your state/form
    setProductImage({
      url: imageUrl,
      publicId: publicId,
      alt: file.name
    });
    
    toast.success('Image uploaded successfully!');
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(error.message || 'Failed to upload image');
  }
};
```

### Multiple Files Upload
```javascript
import { uploadMultipleImages } from '../../services/api';
import { toast } from 'react-toastify';

const handleMultipleUpload = async (files) => {
  try {
    const toastId = toast.info(`Uploading ${files.length} images...`, { autoClose: false });
    
    const response = await uploadMultipleImages(files, 'products');
    
    toast.dismiss(toastId);
    
    const uploadedImages = response.data.files.map(file => ({
      url: file.url,
      publicId: file.publicId,
      alt: file.originalname
    }));
    
    
    setProductImages([...productImages, ...uploadedImages]);
    
    toast.success(`${uploadedImages.length} images uploaded!`);
  } catch (error) {
    console.error('Upload failed:', error);
    toast.error(error.message || 'Failed to upload images');
  }
};
```

### Delete Image
```javascript
import { deleteImage } from '../../services/api';
import { toast } from 'react-toastify';

const handleDeleteImage = async (publicId) => {
  try {
    await deleteImage(publicId);
    
    // Remove from state
    setProductImages(productImages.filter(img => img.publicId !== publicId));
    
    toast.success('Image deleted from Cloudinary');
  } catch (error) {
    console.error('Delete failed:', error);
    toast.error('Failed to delete image');
  }
};
```

## Troubleshooting

### Issue: "File is too large"
**Solution**: 
- Compress image before upload
- Maximum size is 10MB
- Use image compression tools online

### Issue: "Invalid file type"
**Solution**: 
- Ensure file is an image (JPEG, PNG, GIF, WebP, SVG)
- Check file extension matches actual file type

### Issue: "Fallback mode" warning appears
**Solution**: 
- Check backend is running
- Verify backend Cloudinary credentials are set
- Check network connection
- This warning means images are stored as Base64 (not ideal)

### Issue: Upload takes too long
**Solution**: 
- Check file size (compress if needed)
- Check internet connection speed
- Large files (>5MB) may take longer

### Issue: Image not displaying after upload
**Solution**: 
- Check Cloudinary URL is valid
- Verify Cloudinary account is active
- Check browser console for CORS errors
- Ensure backend returned proper URL

## Testing

### Manual Testing Checklist
- [ ] Upload single image < 10MB
- [ ] Upload multiple images
- [ ] Try uploading file > 10MB (should fail with specific error)
- [ ] Try uploading non-image file (should fail)
- [ ] Verify image displays from Cloudinary URL
- [ ] Check browser console for any errors
- [ ] Test with backend offline (should show fallback warning)
- [ ] Delete image from Cloudinary

### Expected Behavior
1. **Success Case**: 
   - ✅ Toast shows "Uploading to Cloudinary..."
   - ✅ Upload completes in < 30 seconds
   - ✅ Toast shows "Image uploaded to Cloudinary successfully!"
   - ✅ Image displays from Cloudinary URL

2. **File Too Large**:
   - ❌ Upload rejected immediately
   - ❌ Toast shows "File is too large. Maximum size is 10MB"

3. **Invalid File Type**:
   - ❌ Upload rejected immediately
   - ❌ Toast shows "Invalid file type. Only JPEG, PNG, GIF, WebP, SVG allowed"

4. **Backend Offline**:
   - ⚠️ Upload falls back to Base64
   - ⚠️ Toast shows "Image uploaded using fallback mode. Please check backend connection."

## Performance Considerations

### Optimizations
- ✅ 30-second timeout for single uploads
- ✅ 60-second timeout for multiple uploads
- ✅ Validation happens client-side before upload
- ✅ Progress feedback for large uploads
- ✅ Cloudinary CDN for fast image delivery

### Best Practices
1. **Compress images** before upload when possible
2. **Limit file sizes** to reasonable amounts (< 5MB recommended)
3. **Use appropriate image dimensions** for your use case
4. **Clean up unused images** using deleteImage()
5. **Use Cloudinary transformations** instead of uploading multiple sizes

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Image Transformation Reference](https://cloudinary.com/documentation/image_transformation_reference)
- [Cloudinary Dashboard](https://cloudinary.com/console)
- Backend Documentation: See backend's `CLOUDINARY_INTEGRATION.md`

## Support

For issues:
1. Check browser console for detailed error messages
2. Check backend logs for server-side errors
3. Verify Cloudinary credentials in backend `.env`
4. Test with smaller file sizes
5. Check Cloudinary dashboard for uploaded images
6. Ensure backend is running and accessible

---

**Last Updated**: October 19, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready

