import { isDirectDisplayableUri, isMediaId, resolveMediaUrl, resolveMediaUrls } from '../mediaService';
import { api } from '../../api/client';

jest.mock('../../api/client', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('mediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isDirectDisplayableUri', () => {
    it('recognizes http/https/file/content/data URIs', () => {
      expect(isDirectDisplayableUri('https://example.com/photo.jpg')).toBe(true);
      expect(isDirectDisplayableUri('http://example.com/photo.jpg')).toBe(true);
      expect(isDirectDisplayableUri('file:///data/user/0/cache/photo.jpg')).toBe(true);
      expect(isDirectDisplayableUri('content://media/external/images/123')).toBe(true);
      expect(isDirectDisplayableUri('data:image/jpeg;base64,...')).toBe(true);
      expect(isDirectDisplayableUri('6ac09a4df7d2fc04d3abac58')).toBe(false);
    });
  });

  describe('isMediaId', () => {
    it('identifies 24-character hexadecimal MongoDB ObjectIds and UUIDs', () => {
      expect(isMediaId('6ac09a4df7d2fc04d3abac58')).toBe(true);
      expect(isMediaId('12345678-1234-1234-1234-123456789abc')).toBe(true);
      expect(isMediaId('https://example.com/img.jpg')).toBe(false);
      expect(isMediaId('')).toBe(false);
    });
  });

  describe('resolveMediaUrl', () => {
    it('returns direct URIs immediately without calling api', async () => {
      const url = 'https://s3.amazonaws.com/bucket/photo.jpg';
      const result = await resolveMediaUrl(url);
      expect(result).toBe(url);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('resolves mediaId by querying /media/:id/url and returns signed URL', async () => {
      const mediaId = '6ac09a4df7d2fc04d3abac58';
      const signedUrl = 'https://s3.amazonaws.com/lumen/photo.jpg?token=abc';
      (api.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { url: signedUrl, expiresIn: 3600 },
      });

      const result = await resolveMediaUrl(mediaId);
      expect(result).toBe(signedUrl);
      expect(api.get).toHaveBeenCalledWith(`/media/${mediaId}/url`);

      // Second call should hit in-memory cache
      const cached = await resolveMediaUrl(mediaId);
      expect(cached).toBe(signedUrl);
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('resolves multiple URLs via resolveMediaUrls', async () => {
      const res = await resolveMediaUrls([
        'https://example.com/pic1.jpg',
        'https://example.com/pic2.jpg',
      ]);
      expect(res).toEqual([
        'https://example.com/pic1.jpg',
        'https://example.com/pic2.jpg',
      ]);
    });
  });
});
