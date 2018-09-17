import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ErrorHandlerService } from '../errors/error-handler.service';

@Injectable()
export class ErrorInterceptorService implements HttpInterceptor {
  constructor(private errorHandlerService: ErrorHandlerService) {}

  /**
   * Intercept, catch, and process errors.
   *
   * @param {HttpRequest<any>} req
   * @param {HttpHandler} next
   * @returns {Observable<HttpEvent<any>>}
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).do(
      (event: HttpEvent<any>) => {
        return next.handle(req);
      },
      (error: any) => {
        // provide url from request if not on response
        if (!error.url) {
          Object.assign(error, {
            url: req.urlWithParams
          });
        }

        this.handleError(error as HttpErrorResponse);
      }
    );
  }

  /**
   * Errors
   *
   * Fatal and Non-fatal(Recoverable) Errors
   * or
   * Server and Client Errors
   *
   * Notification and console log errors.
   *
   * @param {HttpErrorResponse} error
   * @returns {ErrorObservable}
   */
  private handleError(error: HttpErrorResponse) {
    // Temporary workaround
    if (error.status === 404 && error.url) {
      const url = new URL(error.url);

      const no404redirect = (() => {
        if (typeof url.searchParams !== 'undefined') {
          return url.searchParams.get('no404redirect');
        } else {
          return this.getSearchParamPoly(url.search);
        }
      })();

      if (no404redirect) {
        return ErrorObservable.throw(error);
      }
    }

    this.errorHandlerService.handleError(error); // this will notify
    return ErrorObservable.throw(error);
  }

  private getSearchParamPoly(search: string): boolean {
    if (search.indexOf('?') === 0) {
      search = search.slice(1);
    }

    const sChunks = search.split('&');

    for (const chunk of sChunks) {
      const indexOfEquals = chunk.indexOf('=');

      if (indexOfEquals > -1) {
        if (chunk.slice(0, indexOfEquals) === 'no404redirect') {
          return chunk.slice(indexOfEquals + 1) === 'true';
        }
      }
    }
    return false;
  }
}
