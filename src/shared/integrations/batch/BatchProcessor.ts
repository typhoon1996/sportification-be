/**
 * Batch Operations Utility
 *
 * Provides utilities for efficient batch processing of operations
 */

import logger from "../../infrastructure/logging";

export interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, item: any) => void;
}

export class BatchProcessor {
  /**
   * Process items in batches with concurrency control
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchOptions = {}
  ): Promise<R[]> {
    const {batchSize = 10, concurrency = 5, onProgress, onError} = options;

    const results: R[] = [];
    const errors: Array<{item: T; error: Error}> = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, items.length));

      // Process batch with concurrency limit
      const batchPromises = batch.map(async item => {
        try {
          return await processor(item);
        } catch (error) {
          if (onError) {
            onError(error as Error, item);
          }
          errors.push({item, error: error as Error});
          return null;
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...(batchResults.filter(r => r !== null) as R[]));

      // Report progress
      if (onProgress) {
        onProgress(i + batch.length, items.length);
      }

      logger.debug(
        `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`
      );
    }

    if (errors.length > 0) {
      logger.warn(`Batch processing completed with ${errors.length} errors`);
    }

    return results;
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Process with rate limiting (delay between batches)
   */
  static async processBatchWithDelay<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    delayMs: number,
    options: BatchOptions = {}
  ): Promise<R[]> {
    const {batchSize = 10, onProgress} = options;
    const results: R[] = [];
    const chunks = this.chunk(items, batchSize);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (!chunk) continue;

      // Process chunk
      const chunkResults = await Promise.all(
        chunk.map(item => processor(item))
      );
      results.push(...chunkResults);

      // Report progress
      if (onProgress) {
        onProgress((i + 1) * batchSize, items.length);
      }

      // Delay before next chunk (except for last chunk)
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Retry failed operations
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          `Operation failed (attempt ${attempt}/${maxRetries}):`,
          error
        );

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw new Error(lastError!.message || "Operation failed after retries");
  }

  /**
   * Parallel processing with concurrency limit
   */
  static async parallelLimit<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    limit: number
  ): Promise<R[]> {
    const results: R[] = [];
    const executing: Promise<void>[] = [];

    for (const item of items) {
      const promise = processor(item).then(result => {
        results.push(result);
      });

      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }
}

/**
 * Batch update documents in MongoDB
 */
export class BatchDatabaseOperations {
  /**
   * Bulk insert documents
   */
  static async bulkInsert<T>(
    model: any,
    documents: T[],
    options: BatchOptions = {}
  ): Promise<any[]> {
    const {batchSize = 1000} = options;
    const chunks = BatchProcessor.chunk(documents, batchSize);
    const results: any[] = [];

    for (const chunk of chunks) {
      const insertedDocs = await model.insertMany(chunk, {ordered: false});
      results.push(...insertedDocs);
    }

    logger.info(`Bulk inserted ${results.length} documents`);
    return results;
  }

  /**
   * Bulk update documents
   */
  static async bulkUpdate(
    model: any,
    updates: Array<{filter: any; update: any}>,
    options: BatchOptions = {}
  ): Promise<number> {
    const {batchSize = 1000} = options;
    const chunks = BatchProcessor.chunk(updates, batchSize);
    let modifiedCount = 0;

    for (const chunk of chunks) {
      const bulkOps = chunk.map(op => ({
        updateMany: {
          filter: op.filter,
          update: op.update,
        },
      }));

      const result = await model.bulkWrite(bulkOps);
      modifiedCount += result.modifiedCount;
    }

    logger.info(`Bulk updated ${modifiedCount} documents`);
    return modifiedCount;
  }

  /**
   * Bulk delete documents
   */
  static async bulkDelete(
    model: any,
    filters: any[],
    options: BatchOptions = {}
  ): Promise<number> {
    const {batchSize = 1000} = options;
    const chunks = BatchProcessor.chunk(filters, batchSize);
    let deletedCount = 0;

    for (const chunk of chunks) {
      const bulkOps = chunk.map(filter => ({
        deleteMany: {
          filter,
        },
      }));

      const result = await model.bulkWrite(bulkOps);
      deletedCount += result.deletedCount;
    }

    logger.info(`Bulk deleted ${deletedCount} documents`);
    return deletedCount;
  }
}
