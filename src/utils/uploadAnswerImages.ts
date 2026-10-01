/**
 * Before a log is submitted: finds all image-type FieldValues, uploads each
 * local URI via the media pipeline, and replaces the value with the returned
 * mediaId array. Returns the mutated answers array.
 *
 * Uploads that fail are left as local URIs with a warning so the log is not
 * blocked. The media upload queue will retry them later.
 */
import { Answer } from '@lumen/shared';
import { uploadMedia, getMimeType } from '../services/mediaUpload';

export async function uploadAnswerImages(answers: Answer[]): Promise<Answer[]> {
  const result: Answer[] = [];
  for (const ans of answers) {
    const values = await Promise.all(
      (ans.values ?? []).map(async v => {
        if (v.dataType !== 'image') return v;
        const uris: string[] = Array.isArray(v.value) ? v.value : [];
        const mediaIds: string[] = [];
        for (const uri of uris) {
          // Already a mediaId (server ID, not a local file:// or content:// URI)
          if (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('ph://')) {
            mediaIds.push(uri);
            continue;
          }
          try {
            const mime = getMimeType(uri);
            const res = await uploadMedia(uri, mime);
            mediaIds.push(res.mediaId);
          } catch {
            // Keep local URI as fallback — queue will retry
            mediaIds.push(uri);
          }
        }
        return { ...v, value: mediaIds };
      }),
    );
    result.push({ ...ans, values });
  }
  return result;
}
