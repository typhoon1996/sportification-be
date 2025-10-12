/**
 * Query Builder Utility
 *
 * Provides flexible query building for MongoDB with filtering, searching, and sorting
 */

export interface QueryFilters {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  dateRange?: {
    field: string;
    start?: Date;
    end?: Date;
  };
  status?: string[];
  sort?: string;
  order?: 'asc' | 'desc';
}

export class QueryBuilder {
  private query: any;
  private model: any;

  constructor(model: any) {
    this.model = model;
    this.query = model.find();
  }

  /**
   * Apply search filter
   */
  search(searchTerm: string, searchFields: string[]): this {
    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      }));

      this.query = this.query.or(searchConditions);
    }

    return this;
  }

  /**
   * Apply exact filters
   */
  filter(filters: Record<string, any>): this {
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          this.query = this.query.where(key).equals(value);
        }
      });
    }

    return this;
  }

  /**
   * Apply date range filter
   */
  dateRange(field: string, start?: Date, end?: Date): this {
    if (start || end) {
      const dateFilter: any = {};

      if (start) {
        dateFilter.$gte = start;
      }

      if (end) {
        dateFilter.$lte = end;
      }

      this.query = this.query.where(field, dateFilter);
    }

    return this;
  }

  /**
   * Apply status filter (multiple values)
   */
  status(statuses: string[]): this {
    if (statuses && statuses.length > 0) {
      this.query = this.query.where('status').in(statuses);
    }

    return this;
  }

  /**
   * Apply sorting
   */
  sort(sortField: string = 'createdAt', order: 'asc' | 'desc' = 'desc'): this {
    const sortObj = { [sortField]: order === 'asc' ? 1 : -1 };
    this.query = this.query.sort(sortObj);
    return this;
  }

  /**
   * Apply population
   */
  populate(fields: string | string[]): this {
    if (Array.isArray(fields)) {
      fields.forEach((field) => {
        this.query = this.query.populate(field);
      });
    } else {
      this.query = this.query.populate(fields);
    }

    return this;
  }

  /**
   * Select specific fields
   */
  select(fields: string): this {
    this.query = this.query.select(fields);
    return this;
  }

  /**
   * Apply limit
   */
  limit(limit: number): this {
    this.query = this.query.limit(limit);
    return this;
  }

  /**
   * Apply skip
   */
  skip(skip: number): this {
    this.query = this.query.skip(skip);
    return this;
  }

  /**
   * Get the query
   */
  getQuery(): any {
    return this.query;
  }

  /**
   * Execute query
   */
  async execute(): Promise<any[]> {
    return await this.query.exec();
  }

  /**
   * Count documents
   */
  async count(): Promise<number> {
    return await this.model.countDocuments(this.query.getFilter());
  }

  /**
   * Build complete query from filters object
   */
  static buildFromFilters(model: any, filters: QueryFilters): QueryBuilder {
    const builder = new QueryBuilder(model);

    if (filters.search && filters.searchFields) {
      builder.search(filters.search, filters.searchFields);
    }

    if (filters.filters) {
      builder.filter(filters.filters);
    }

    if (filters.dateRange) {
      builder.dateRange(filters.dateRange.field, filters.dateRange.start, filters.dateRange.end);
    }

    if (filters.status) {
      builder.status(filters.status);
    }

    if (filters.sort) {
      builder.sort(filters.sort, filters.order || 'desc');
    }

    return builder;
  }
}

/**
 * Extract query filters from request
 */
export const extractQueryFilters = (query: any): QueryFilters => {
  const filters: QueryFilters = {};

  // Search
  if (query.search) {
    filters.search = query.search;
    filters.searchFields = query.searchFields
      ? query.searchFields.split(',')
      : ['name', 'description'];
  }

  // General filters
  if (query.status) {
    filters.status = Array.isArray(query.status) ? query.status : [query.status];
  }

  // Date range
  if (query.startDate || query.endDate) {
    filters.dateRange = {
      field: query.dateField || 'createdAt',
      start: query.startDate ? new Date(query.startDate) : undefined,
      end: query.endDate ? new Date(query.endDate) : undefined,
    };
  }

  // Sorting
  filters.sort = query.sort || 'createdAt';
  filters.order = query.order === 'asc' ? 'asc' : 'desc';

  // Additional filters
  const additionalFilters: Record<string, any> = {};
  const knownParams = [
    'search',
    'searchFields',
    'status',
    'startDate',
    'endDate',
    'dateField',
    'sort',
    'order',
    'page',
    'limit',
  ];

  Object.keys(query).forEach((key) => {
    if (!knownParams.includes(key) && query[key]) {
      additionalFilters[key] = query[key];
    }
  });

  if (Object.keys(additionalFilters).length > 0) {
    filters.filters = additionalFilters;
  }

  return filters;
};
