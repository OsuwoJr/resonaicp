import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ExternalBlob } from '../backend';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Recursively converts all BigInt values in an object to numbers.
 * This is necessary because BigInt values cannot be serialized by JSON.stringify,
 * which React Query uses internally for query keys and caching.
 * 
 * Preserves ExternalBlob instances and their methods.
 * 
 * @param obj - The object to convert
 * @returns A new object with all BigInt values converted to numbers
 */
export function convertBigIntsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle BigInt
  if (typeof obj === 'bigint') {
    return Number(obj) as T;
  }

  // Preserve ExternalBlob instances - don't convert them
  if (obj instanceof ExternalBlob) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => convertBigIntsToNumbers(item)) as T;
  }

  // Handle objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertBigIntsToNumbers(obj[key]);
      }
    }
    return converted as T;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Converts BigInt values in OrderFilter to be safe for React Query keys.
 * Specifically handles the Time (bigint) fields.
 */
export function sanitizeOrderFilter(filter: any): any {
  if (!filter) return filter;

  return {
    ...filter,
    startDate: filter.startDate !== undefined ? Number(filter.startDate) : undefined,
    endDate: filter.endDate !== undefined ? Number(filter.endDate) : undefined,
  };
}

/**
 * Type helper to convert BigInt fields to numbers in a type definition.
 * Preserves ExternalBlob and other class instances.
 */
export type ConvertBigIntToNumber<T> = T extends bigint
  ? number
  : T extends ExternalBlob
  ? ExternalBlob
  : T extends Array<infer U>
  ? Array<ConvertBigIntToNumber<U>>
  : T extends object
  ? { [K in keyof T]: ConvertBigIntToNumber<T[K]> }
  : T;

/**
 * Type guard to check if a value is an ExternalBlob instance
 */
export function isExternalBlob(value: any): value is ExternalBlob {
  return value instanceof ExternalBlob;
}

/**
 * Safely get the direct URL from an ExternalBlob with error handling
 */
export function getImageUrl(blob: any): string | null {
  try {
    if (blob && isExternalBlob(blob)) {
      return blob.getDirectURL();
    }
    return null;
  } catch (error) {
    console.error('Error getting image URL from ExternalBlob:', error);
    return null;
  }
}
