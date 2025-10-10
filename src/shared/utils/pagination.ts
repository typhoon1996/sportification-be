/**
 * Pagination Utility
 *
 * Provides standardized pagination functionality across all modules
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PaginationHelper {
  /**
   * Validate and normalize pagination options
   */
  static validateOptions(options: PaginationOptions): Required<PaginationOptions> {
    const page = Math.max(1, parseInt(String(options.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(options.limit || 10))));
    const sort = options.sort || 'createdAt';
    const order = options.order === 'asc' ? 'asc' : 'desc';

    return { page, limit, sort, order };
  }

  /**
   * Calculate skip value for MongoDB
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Build MongoDB sort object
   */
  static buildSortObject(sort: string, order: 'asc' | 'desc'): Record<string, 1 | -1> {
    return { [sort]: order === 'asc' ? 1 : -1 };
  }

  /**
   * Create paginated result
   */
  static createResult<T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Execute paginated query
   */
  static async executePaginatedQuery<T>(
    query: any,
    options: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort, order } = this.validateOptions(options);
    const skip = this.calculateSkip(page, limit);
    const sortObj = this.buildSortObject(sort, order);

    const [data, totalItems] = await Promise.all([
      query.sort(sortObj).skip(skip).limit(limit).exec(),
      query.model.countDocuments(query.getFilter()),
    ]);

    return this.createResult<T>(data, totalItems, page, limit);
  }
}

/**
 * Extract pagination parameters from request query
 */
export const getPaginationParams = (query: any): PaginationOptions => {
  return {
    page: query.page ? parseInt(query.page) : 1,
    limit: query.limit ? parseInt(query.limit) : 10,
    sort: query.sort || 'createdAt',
    order: query.order === 'asc' ? 'asc' : 'desc',
  };
};
