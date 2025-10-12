/**
 * Data Export Utility
 *
 * Provides data export functionality in various formats
 */

import { Response } from 'express';
import logger from '../logging';

export class DataExporter {
  /**
   * Export data as CSV
   */
  static exportAsCSV(res: Response, data: any[], filename: string, fields?: string[]): void {
    try {
      if (data.length === 0) {
        res.status(404).json({ success: false, message: 'No data to export' });
        return;
      }

      // Determine fields from first object if not provided
      const csvFields = fields || Object.keys(data[0]);

      // Create CSV header
      const header = csvFields.join(',');

      // Create CSV rows
      const rows = data.map((item) => {
        return csvFields
          .map((field) => {
            const value = item[field];
            // Handle values with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          })
          .join(',');
      });

      // Combine header and rows
      const csv = [header, ...rows].join('\n');

      // Set headers and send response
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);

      logger.info(`Exported ${data.length} records as CSV: ${filename}`);
    } catch (error) {
      logger.error('CSV export error:', error);
      throw error;
    }
  }

  /**
   * Export data as JSON
   */
  static exportAsJSON(res: Response, data: any, filename: string): void {
    try {
      const json = JSON.stringify(data, null, 2);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.send(json);

      logger.info(`Exported data as JSON: ${filename}`);
    } catch (error) {
      logger.error('JSON export error:', error);
      throw error;
    }
  }

  /**
   * Export data as Excel-compatible format
   */
  static exportAsExcel(res: Response, data: any[], filename: string, fields?: string[]): void {
    try {
      if (data.length === 0) {
        res.status(404).json({ success: false, message: 'No data to export' });
        return;
      }

      const csvFields = fields || Object.keys(data[0]);

      // Create tab-separated values (Excel compatible)
      const header = csvFields.join('\t');
      const rows = data.map((item) => {
        return csvFields.map((field) => item[field] ?? '').join('\t');
      });

      const tsv = [header, ...rows].join('\n');

      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xls"`);
      res.send(tsv);

      logger.info(`Exported ${data.length} records as Excel: ${filename}`);
    } catch (error) {
      logger.error('Excel export error:', error);
      throw error;
    }
  }

  /**
   * Export data based on format parameter
   */
  static export(
    res: Response,
    data: any[],
    filename: string,
    format: 'csv' | 'json' | 'excel' = 'json',
    fields?: string[]
  ): void {
    switch (format) {
      case 'csv':
        this.exportAsCSV(res, data, filename, fields);
        break;
      case 'excel':
        this.exportAsExcel(res, data, filename, fields);
        break;
      case 'json':
      default:
        this.exportAsJSON(res, data, filename);
        break;
    }
  }
}

/**
 * Export middleware for easy route integration
 */
export const exportData = (
  getData: (req: any) => Promise<any[]>,
  filename: string,
  fields?: string[]
) => {
  return async (req: any, res: Response) => {
    try {
      const data = await getData(req);
      const format = (req.query.format as 'csv' | 'json' | 'excel') || 'json';

      DataExporter.export(res, data, filename, format, fields);
    } catch (error) {
      logger.error('Export middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data',
      });
    }
  };
};
