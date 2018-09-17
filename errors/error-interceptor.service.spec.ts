import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../notification/notification.service';
import { TestBed } from '@angular/core/testing';
import { ErrorInterceptorService } from '../interceptors/error-interceptor.service';
import { AppConfigService } from '../config/app-config/app-config.service';
import { ErrorHandlerService } from '../errors/error-handler.service';
import { ErrorLogService } from '../errors/error-log.service';
import { MessageBusService } from '../message-bus/message-bus.service';
import { MessagesService } from '../messages/messages.service';
import { HttpTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { noop } from 'rxjs';
import { HttpClientModule } from '@angular/http';

describe('ErrorInterceptorService', () => {

  // service
  let http;
  let service;
  let errorHandlerService;

  // spy
  let errorHandlerServiceHandleErrorSpy;

  // mock
  let httpMock;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {

    TestBed.configureTestingModule({
      imports: [
        HttpTestingModule,
        HttpClientModule
      ],
      providers: [
        AppConfigService,
        ErrorLogService,
        ErrorHandlerService,
        NotificationService,
        MessageBusService,
        MessagesService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: ErrorInterceptorService,
          multi: true
        }
      ]
    });
    // service
    http = TestBed.get(HttpClient);
    service = TestBed.get(ErrorHandlerService);
    errorHandlerService = TestBed.get(ErrorHandlerService);

    // spies
    errorHandlerServiceHandleErrorSpy = spyOn(errorHandlerService, 'handleError');

    // mock
    httpMock = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    // httpMock.verify();
  });

  it(
    'should be defined',
    () => expect(service).toBeDefined()
  );

  describe('Successful HTTP Responses', () => {
    beforeEach(() => {
      mockResponse = {
        status: 200,
        statusText: 'TEST: Response Message'
      };

      http.get('/data').subscribe(
        response => {
          expect(response).toBeTruthy();
        }
      );

    });
    it(
      'should pass-through successful responses',
      () => {
        mockRequest = httpMock.expectOne('/data');

        expect(mockRequest.request.method).toEqual('GET');
        mockRequest.flush(mockResponse);

        expect(errorHandlerServiceHandleErrorSpy).not.toHaveBeenCalled();
        httpMock.verify();
      }
    );
  });

  describe('Error HTTP Responses', () => {
    beforeEach(() => {
      mockResponse = {
        status: 500,
        statusText: 'TEST: Response Message'
      };

      http.get('/data').subscribe(
        response => noop,
        error => {
          // 'it should throw an HttpErrorResponse for continued error handling by caller'
          expect(error instanceof HttpErrorResponse).toBeTruthy();
          expect(error).toBeTruthy();
        }
      );

    });
    it(
      'should capture error responses and handle the error',
      () => {
        mockRequest = httpMock.expectOne('/data').error(new ErrorEvent('network error'));

        httpMock.verify();

        expect(errorHandlerServiceHandleErrorSpy).toHaveBeenCalled();
      }
    );
  });
});
