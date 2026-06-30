/**
 * TODO: интеграция с S3 для загрузки картинок вопросов квиза.
 * MVP: imageUrl передаётся клиентом как строка (внешний URL или будущий ключ S3).
 */
export const mediaStorage = {
  /**
   * TODO: uploadQuizImage(file) → { url: string }
   * Bucket, ACL, presigned URLs — на этапе S3.
   */
  assertImageUrlReady(_imageUrl: string | null | undefined): void {
    // Заглушка: валидация формата выполняется в Zod-схемах API.
  },
};
