import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpClientModule, HttpErrorResponse, HttpHandler } from '@angular/common/http';
import {
  AppConfigService, ErrorHandlerService, ErrorLogService, MessageBusService, MessagesService,
  NotificationService
} from '@lexus/core/services';
import { MatSnackBarModule } from '@angular/material';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ErrorHandlerService', () => {
  const TARGET = 'TARGET';
  const FALSE_TARGET = 'FALSE_TARGET';

  // services
  let service;
  let notificationService;
  let logService;
  let appConfigService;

  // mocks
  let errorMock;
  let appConfigMock;

  // spies
  let notificationServiceOpenDialogSpy;
  let notificationServiceOpenStatusSpy;
  let logServiceLogSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        NoopAnimationsModule,
        HttpClientModule
      ],
      providers: [
        AppConfigService,
        MessageBusService,
        ErrorHandlerService,
        HttpClientModule,
        NotificationService,
        ErrorLogService,
        MessagesService,
        HttpClient,
        HttpHandler
      ]
    });
    // services
    service = TestBed.get(ErrorHandlerService);
    notificationService = TestBed.get(NotificationService);
    logService = TestBed.get(ErrorLogService);
    appConfigService = TestBed.get(AppConfigService);

    // spies
    notificationServiceOpenDialogSpy = spyOn(notificationService, 'openDialog');
    notificationServiceOpenStatusSpy = spyOn(notificationService, 'openStatus');
    logServiceLogSpy = spyOn(logService, 'log');

    /*
     * Mocks
     */
    // http mock - VALIDATION ERROR RESPONSE
    errorMock = new HttpErrorResponse({
      error: {
        message: 'TEST - error: message: Http Error Response'
      },
      status: 500,
      statusText: 'TEST - statusText: Http Error Response',
      url: '/data'
    });
    // app config mock
    appConfigMock = {
      environment: {
        type: 'PROD'
      }
    };
    Object.assign(appConfigService.config, appConfigMock);

    // state
    service.notifyEnabled = true;
    expect(service.notifyEnabled).toBeTruthy();

    service.logEnabled = true;
    expect(service.logEnabled).toBeTruthy();
  });

  it(
    'should be defined',
    () => expect(service).toBeDefined()
  );

  describe('Notifications feature enabled/disabled', () => {
    it(
      'should notify when feature is enabled ',
      () => {
        service.notifyEnabled = true;
        expect(service.notifyEnabled).toBeTruthy();

        service.handleError(new HttpErrorResponse(errorMock));
        expect(notificationServiceOpenStatusSpy).toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
      }
    );

    it(
      'should not notify when feature is disabled ',
      () => {
        service.notifyEnabled = false;
        expect(service.notifyEnabled).toBeFalsy();

        service.handleError(new HttpErrorResponse(errorMock));
        expect(notificationServiceOpenStatusSpy).not.toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
      }
    );
  });

  describe('Logger feature enabled/disabled', () => {
    it(
      'should log when feature is enabled ',
      () => {
        service.logEnabled = true;
        expect(service.logEnabled).toBeTruthy();

        service.handleError(new HttpErrorResponse(errorMock));
        expect(logServiceLogSpy).toHaveBeenCalled();
      }
    );

    it(
      'should not log when feature is disabled ',
      () => {
        service.logEnabled = false;
        expect(service.logEnabled).toBeFalsy();

        service.handleError(new HttpErrorResponse(errorMock));
        expect(logServiceLogSpy).not.toHaveBeenCalled();
      }
    );
  });

  describe('Render the proper notification type according to specified configurations for HttpErrorResponse types',
    () => {
      it(
        'should render a status bar - HTTP 500 VALIDATION',
        () => {
          // lack of an error object distinguishes between 500 validation errors TODO: finalize contract
          service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
            status: 500
          })));
          expect(notificationServiceOpenStatusSpy).toHaveBeenCalled();
          expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
        }
      );

      it(
        'should render a dialog - HTTP 500',
        () => {
          // lack of an error object distinguishes between 500 validation errors TODO: finalize contract
          delete errorMock.error;
          service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
            status: 500
          })));
          expect(notificationServiceOpenStatusSpy).not.toHaveBeenCalled();
          expect(notificationServiceOpenDialogSpy).toHaveBeenCalled();
        }
      );

      it(
        'should render a dialog - HTTP 400',
        () => {
          delete errorMock.error;
          service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
            status: 400
          })));
          expect(notificationServiceOpenStatusSpy).not.toHaveBeenCalled();
          expect(notificationServiceOpenDialogSpy).toHaveBeenCalled();
        }
      );
      it(
        'should render a dialog - HTTP 0',
        () => {
          service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
            status: 0
          })));
          expect(notificationServiceOpenStatusSpy).not.toHaveBeenCalled();
          expect(notificationServiceOpenDialogSpy).toHaveBeenCalled();
        }
      );

    });

  describe('Render the proper notification type according to unspecified (no config) HttpErrorResponse types', () => {
    it(
      'should render a status bar - HTTP 4xx',
      () => {
        service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
          status: 444
        })));
        expect(notificationServiceOpenStatusSpy).toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
      }
    );

    it(
      'should render a dialog - HTTP 5xx',
      () => {
        service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
          status: 555
        })));
        expect(notificationServiceOpenStatusSpy).not.toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).toHaveBeenCalled();
      }
    );
    it(
      'should render a status bar - HTTP Unavailable - No generic type found (create one? xxx)',
      () => {
        service.handleError(new HttpErrorResponse(Object.assign(errorMock, {
          status: 303
        })));
        expect(notificationServiceOpenStatusSpy).toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
      }
    );
    it(
      'should render a status bar - no status at all',
      () => {
        delete errorMock.status;
        service.handleError(new HttpErrorResponse(errorMock));
        expect(notificationServiceOpenStatusSpy).not.toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).toHaveBeenCalled();
      }
    );
  });

  describe('Error Messages - should retrieve the error message according to payload location strategy', () => {
    it(
      'should target the error message if available',
      () => {
        Object.assign(errorMock, {
          statusText: FALSE_TARGET,
          message: FALSE_TARGET,
          error: {
            message: TARGET
          }
        });
        expect(service.getMessage(errorMock)).toEqual(TARGET);
      }
    );

    it(
      'should target the response message if error.message not available',
      () => {
        Object.assign(errorMock, {
          statusText: FALSE_TARGET,
          message: TARGET,
          error: {}
        });
        expect(service.getMessage(errorMock)).toEqual(TARGET);
      }
    );

    it(
      'should target the response message if error.message not available',
      () => {
        delete errorMock.error;
        Object.assign(errorMock, {
          statusText: FALSE_TARGET,
          message: TARGET
        });
        expect(service.getMessage(errorMock)).toEqual(TARGET);
      }
    );

    it(
      'should target the response status message, if response message and error.message are not available',
      () => {
        delete errorMock.message;
        Object.assign(errorMock, {
          statusText: TARGET,
          error: {}
        });
        expect(service.getMessage(errorMock)).toEqual(TARGET);
      }
    );
  });

  describe('Render the proper notification type according to specified configurations for runtime errors', () => {
    beforeEach(() => {
      service.runtimeErrorEnabled = true;
      errorMock = new Error('A JavaScript Error');
    });
    it(
      'should render a status bar - Error Type - Not an HTTP Error Response.',
      () => {
        service.handleError(errorMock);
        expect(notificationServiceOpenStatusSpy).toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
      }
    );

    it(
      'should render a status bar - Error is String - Not an HTTP Error Response.',
      () => {
        service.handleError('A string version of a JavaScript Error');
        expect(notificationServiceOpenStatusSpy).toHaveBeenCalled();
        expect(notificationServiceOpenDialogSpy).not.toHaveBeenCalled();
      }
    );
  });
});
