import { Injectable } from '@angular/core';

/**
 * Log service for connecting to server side capturing solution.
 */
@Injectable()
export class ErrorLogService {
  constructor() {}

  /**
   * Log an error.
   *
   * @param error
   */
  log(error: any) {
    const date = new Date().toISOString();
    if (error instanceof TypeError) {
      console.error(date, 'Type error: ', error.message);
    } else if (error instanceof Error) {
      console.error(date, 'General error: ', error.message);
    } else {
      console.error(date, 'Unknown error type: ', error);
    }
  }
}
