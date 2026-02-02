import { BaseService } from "../../services/base.service.ts";
import { StorageException } from "../exceptions/index.ts";

export class StorageRepository extends BaseService {
  public async ensureBucket(name: string, isPublic: boolean): Promise<void> {
    const { data: buckets, error } = await this.supabase.storage.listBuckets();
    if (error) {
      this.logger.error("List buckets failed", { error: error.message });
      throw new StorageException(error.message);
    }

    const exists = (buckets ?? []).some((bucket) => bucket.name === name);
    if (exists) {
      return;
    }

    const { error: createError } = await this.supabase.storage.createBucket(name, {
      public: isPublic,
    });

    if (createError) {
      this.logger.error("Create bucket failed", { error: createError.message });
      throw new StorageException(createError.message);
    }
  }

  public async uploadPublic(
    bucketName: string,
    path: string,
    data: Uint8Array,
    contentType: string,
  ): Promise<string> {
    const { error: uploadError } = await this.supabase.storage
      .from(bucketName)
      .upload(path, data, { contentType, upsert: true });

    if (uploadError) {
      this.logger.error("Upload failed", { error: uploadError.message });
      throw new StorageException(uploadError.message);
    }

    const { data: urlData, error: urlError } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    if (urlError || !urlData?.publicUrl) {
      const message = urlError?.message ?? "Public URL missing";
      this.logger.error("Public URL fetch failed", { error: message });
      throw new StorageException(message);
    }

    return urlData.publicUrl;
  }
}
