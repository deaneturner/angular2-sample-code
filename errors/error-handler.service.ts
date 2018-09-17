message-busimport { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ErrorLogService } from './error-log.service';
import { NotificationService } from '../notification/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import {
  NotificationDialog,
  NotificationDialogConfig,
  NotificationStatus,
  NotificationStatusConfig
} from '../notification/notification.interface';
import { cloneDeep } from 'lodash-es';
import { MatDialog, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { MessageBusService } from '../message-bus/message-bus.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationEventMessage } from '../message-bus/notification-event-message';
import { Router } from '@angular/router';
import { FormEventMessage } from '../message-bus/form-event-message';

/**
 * Processes errors and passes them for notification and/or logging.
 *
 * Error types are configurable via the
 * [notifications configuration](/injectables/ErrorHandlerService.html#notifications).
 *
 */
@Injectable()
export class ErrorHandlerService extends ErrorHandler {

  static FATAL = '5xx';
  static NON_FATAL = '4xx';
  static INFORMATIONAL = '1xx';
  static UNAVAILABLE = 'unavailable';
  static VALIDATION = 'validation';
  static MESSAGE_NOT_FOUND = 'No message found to describe the error!';
  static PROLONG = 'prolong';
  static CHANNEL_CONFIG = 'channel-configs';
  static NO_REDIRECT_HEADER = 'x-noredirect';

  private urlErrorTypes = [
    ErrorHandlerService.PROLONG,
    ErrorHandlerService.CHANNEL_CONFIG
  ];

  /**
   *
   *  Detect Error and Provide Customized Notification
   *
   * ````javascript
   *    400: {
   *         name: 'HTTP 400',
   *         type: NotificationService.TYPE_DIALOG,
   *         config: {}
   *       },
   *    403: {
   *         name: 'HTTP 403',
   *         type: NotificationService.TYPE_DIALOG,
   *         config: {
   *           data: {
   *             message: 'Authorization Error'
   *           }
   *         }
   *       },
   *    500: {
   *         name: 'Error Connection Timeout 500',
   *         type: NotificationService.TYPE_DIALOG,
   *         config: {
   *           data: {
   *             title: 'Custom TITLE',
   *             subTitle: 'Custom SUBTITLE',
   *             buttons: [{
   *               label: 'OK',
   *               action: () => {
   *                 this.notificationService.getDialogRef().close();
   *               }
   *             }, {
   *               label: 'Cancel',
   *               action: () => {
   *                 this.notificationService.getDialogRef().close();
   *              }
   *             }]
   *           }
   *         }
   *       }
   * ````
   *
   * @type {{}}
   */
  private notifications = {};
  private redirects = {};
  private messages;
  private logEnabled = false;
  private notifyEnabled = true;
  private runtimeErrorEnabled = false;

  constructor(private logger: ErrorLogService,
              private notificationService: NotificationService,
              private messageBusService: MessageBusService,
              private messagesService: MessagesService,
              private injector: Injector) {
    super();

    // this.messagesService.getMessages([373264, 373266, 373266, 371123, 371124, 371125]).then((messages) => {
    //   this.messages = messages;
    // });

    // ViewBag.Title = Messages.GetMessageText(channelInfo.ChannelID, 373264);
    //
    // ViewBag.HeadContent = Messages.GetMessageText(channelInfo.ChannelID, 373266);
    //
    // ViewBag.BodyContent = Messages.GetMessageText(channelInfo.ChannelID, 373265);

    // <div class="col-sm-12">
    //   <h1>{{$root.msg(371123)}}&nbsp;<span ng-if="$root.registry.localStore.global.context.EnvironmentType
    //   != 'Production'">-&nbsp;{{error.statusText}}</span></h1>
    // <hr />
    // <h2 ng-bind="$root.msg(371124)"></h2>
    //   <h3 ng-bind="$root.msg(371125)"></h3>
    //   </div>
    //   <div class="col-sm-12">
    //   <h3>{{error.config.url}}</h3>
    // <h4>{{error.data.exceptionGuid}}</h4>
    // <!--<hr /><pre>{{error | json}}</pre><hr />-->
    // </div>

    this.init();
  }

  /**
   * Handle error, notify and/or log.
   *
   * @param {Error | HttpErrorResponse} error
   */
  handleError(error: Error | HttpErrorResponse) {
    let notification;
    super.handleError(error);

    // log
    if (this.logEnabled) {
      this.logger.log(error);
    }

    // notify
    if (this.notifyEnabled) {
      notification = this.getNotification(error);
      if (notification) {
        this.notify(notification);
      }
    }
  }

  private init() {
    /**
     * Load notification definitions.
     *
     * Loaded here because configs may have method assignments that require initialization.
     */
    Object.assign(this.notifications, {
      0: NotificationService.helpers.config
        .getDialogNotification('Status 0 - Reported due to improper CORS configuration.'),
      400: NotificationService.helpers.config.getDialogNotification('Bad Request'),
      403: NotificationService.helpers.config.getDialogNotification('Authorization Error'),
      500: NotificationService.helpers.config.getDialogNotification('Internal Server Error'),
      502: NotificationService.helpers.config.getDialogNotification('Unreachable Server Error'),
    });
    // PROLONG
    this.notifications[ErrorHandlerService.PROLONG] =
      NotificationService.helpers.config.getDialogNotification('Activity Timeout');
    // CONNECTION
    this.notifications[ErrorHandlerService.CHANNEL_CONFIG] = NotificationService.helpers.config
      .getDialogNotification('Channel Configuration Retrieval Error');

    Object.assign(this.redirects, {
      401: {
        path: '/errors/404-not-found'
      },
      404: {
        path: '/errors/404-not-found'
      }
    });
  }

  /**
   * Display a notification according to the signature of the given configuration.
   *
   * This feature is used by the [error handling service](/injectables/ErrorHandlerService.html)
   * to notify on varied set of error conditions.
   *
   *
   *
   * ````javascript
   * {
   *  name: 'Error Connection Timeout',
   *  type: NotificationService.TYPE_DIALOG,
   *  config: {
   *   data: {
   *    message: 'Connection Timeout'
   *   }
   *  }
   * }
   * ````
   * ---
   * ##### Custom
   *
   * ````javascript
   *      {
   *           name: 'Error Connection Timeout',
   *           type: NotificationService.TYPE_DIALOG,
   *           config: {
   *             data: {
   *            title: 'Custom TITLE',
   *            subTitle: 'Custom SUBTITLE',
   *            buttons: [{
   *              label: 'OK',
   *              action: () => {
   *                this.notificationService.getDialogRef().close();
   *              }
   *            }, {
   *              label: 'Cancel',
   *              action: () => {
   *                this.notificationService.getDialogRef().close();
   *              }
   *            }]
   *          }
   *        }
   *      }
   * ````
   *
   *
   * @param {NotificationDialog | NotificationStatus | NotificationStatusConfig} notification
   * @returns {MatDialog | MatSnackBar}
   */
  private notify(notification: NotificationDialog | NotificationStatus): MatDialog | MatSnackBarRef<SimpleSnackBar> {
    let result;
    if (notification) {
      this.messageBusService.publish(new NotificationEventMessage({
        pubsub: MessageBusService.PUBSUB.NOTIFICATION,
        data: notification
      }));
    } else {
      // notification was sent by getNotification
      result = null;
    }

    return result;
  }

  private getDefaultErrorNotification(error: HttpErrorResponse | Error | string, type: string)
  : NotificationDialog | NotificationStatus {
    let result;

    switch (type) {
      case NotificationService.TYPE_STATUS: {
        result = NotificationService.helpers.config.getStatusNotification(this.getMessage(error));
        break;
      }

      case NotificationService.TYPE_DIALOG: {
        result = NotificationService.helpers.config.getDialogNotification(this.getMessage(error));
        break;
      }

      default: {
        throw new Error('Provided notification type ' + type + 'does not exist.');
      }
    }

    if ((error instanceof HttpErrorResponse) && (type === NotificationService.TYPE_DIALOG)) {
      if (result && result.config && result.config.data) {
        Object.assign(result.config.data, {
          details: this.getDetails(error as HttpErrorResponse)
        });
      }
    }
    return result;
  }

  private getNotificationConfig(error: HttpErrorResponse) {
    let key;

    // check url for url parsed error types
    if (error.url) {
      key = this.getUrlErrorType(error);
    }

    if (!key || (key === ErrorHandlerService.UNAVAILABLE)) {
      key = error.status;
    }
    return this.notifications[key];
  }

  /**
   * Get Notification
   *
   * Either returns a notification,
   * or calls the notification system to display a notification.
   *
   * If the HTTP error code has been defined in the notifications field,
   * it returns the config  - using it as a base - and applies details and error message.
   *
   * Otherwise, it determines the error type (fatal, non-fatal, etc.) from the error status code.
   * Constructs and opens a notification,
   * directly using the [openDialog](http://127.0.0.1:8889/injectables/NotificationService.html#openDialog)
   * or [openStatus](http://127.0.0.1:8889/injectables/NotificationService.html#openStatus) methods of the
   * [notification service](http://127.0.0.1:8889/injectables/NotificationService.html).
   *
   * Applies details to the message notification details payload.
   * For now, the request URL from which the error originated - could be much more.
   *
   *
   * @param {HttpErrorResponse | Error | String} error
   * @returns {NotificationDialog | NotificationStatus}
   */
  private getNotification(error: HttpErrorResponse | Error | string)
  : NotificationDialog | NotificationStatus | undefined {
    let result: NotificationDialog | NotificationStatus | undefined;
    let notification: NotificationDialog;
    let redirect;
    let config: NotificationDialogConfig;
    if (error instanceof HttpErrorResponse) {
      if (error.status || error.status === 0) {
        notification = this.getNotificationConfig(error);
        redirect = this.redirects[error.status];
        // TODO: Refactor after error response contract has been resolved for validation errors
        if (notification && !(this.getHttpErrorType(error) === ErrorHandlerService.VALIDATION)) {
          /*
           * A notification config has been defined for this error status code.
           */
          result = cloneDeep(notification);
          config = result.config || (result.config = {});
          Object.assign((config.data || (config.data = {})), {
            details: this.getDetails(error),
            message: (config.data && config.data.message) || this.getMessage(error)
          });
        } else if (redirect) {
          if (this.checkNo401Redirect(error)) {
            result = NotificationService.helpers.config.getDialogNotification({
              data: {
                details: error.error.message,
                message: error.statusText
              }
            });
          } else {
            this.injector.get(Router).navigate([redirect.path]).then(() => {
              return result;
            });
          }
        } else {
          /*
           * No notification config has been defined for this error status code.
           * Determine a notification type from the error payload characteristics.
           */
          result = this.getNotificationFromHttpError(error);
        }
      } else {
        /**
         * HTTPErrorResponse - But no status code, nor characteristics to decipher a notification type.
         *
         * This is the fallback notification.
         */
        result = this.getDefaultErrorNotification(error, NotificationService.TYPE_STATUS);
      }
    } else if (this.runtimeErrorEnabled && ((error instanceof Error) || (typeof error === 'string'))) {
      /**
       * Runtime Error
       *
       * Can be an error or a string.
       */
      result = this.getDefaultErrorNotification(error, NotificationService.TYPE_STATUS);
    }

    return result;
  }

  /**
   * Determine a notification type from the error payload characteristics.
   *
   * @param {HttpErrorResponse} error
   * @returns {NotificationDialog | NotificationStatus}
   */
  private getNotificationFromHttpError(error: HttpErrorResponse): NotificationDialog | NotificationStatus {
    let result;
    let urlErrorType;
    let notification;
    let config;
    switch (this.getHttpErrorType(error)) {
      /*
       * HTTP Status Code Errors
       */
      case ErrorHandlerService.FATAL: {
        result = this.getDefaultErrorNotification(error, NotificationService.TYPE_DIALOG);
        break;
      }

      case
      ErrorHandlerService.NON_FATAL: {
        result = this.getDefaultErrorNotification(error, NotificationService.TYPE_STATUS);
        break;
      }

      case
      ErrorHandlerService.VALIDATION: {
        /*
         * Send an event - message bus publish.
         */
        this.messageBusService.publish(new FormEventMessage({
          pubsub: MessageBusService.PUBSUB.FORM,
          data: error
        }));
        // notification
        result = this.getDefaultErrorNotification(error, NotificationService.TYPE_STATUS);
        break;
      }
      case
      ErrorHandlerService.UNAVAILABLE: {
        urlErrorType = this.getUrlErrorType(error);
        notification = this.notifications[urlErrorType];
        if (urlErrorType && notification) {
          /*
           * URL Error Type
           */
          result = cloneDeep(notification);
          config = result.config;
          Object.assign((config.data || (config.data = {})), {
            details: this.getDetails(error),
            detailsEnabled: urlErrorType === ErrorHandlerService.CHANNEL_CONFIG // environment params not available
          });
        } else {
          result = this.getDefaultErrorNotification(error, NotificationService.TYPE_STATUS);
        }
        break;
      }
      default: {
        /*
         * NOT FOUND
         */
        result = NotificationService.helpers.config.getDialogNotification({
          data: {
            details: 'Please identify and configure the error handler service so that it can process this error.',
            message: 'Unidentified Error Condition'  // temporary for experience iteration
            // - eventually to UX generic "sorry"
          }
        });
      }
    }
    return result;
  }

  /**
   * Get the message from the many varieties of Error object.
   *
   * @param {HttpErrorResponse | Error | String} error
   * @returns {any}
   */
  private getMessage(error: HttpErrorResponse | Error | string) {
    let message;

    if (error instanceof HttpErrorResponse) {
      if (error.error && error.error.message) {
        message = error.error.message;
      } else {
        if (error.message) {
          message = error.message || ErrorHandlerService.MESSAGE_NOT_FOUND;
        } else if (error.statusText) {
          message = error.statusText;
        } else {
          message = ErrorHandlerService.MESSAGE_NOT_FOUND;
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error || ErrorHandlerService.MESSAGE_NOT_FOUND;
    }
    return message;
  }

  /**
   * Get the error type
   *
   * @param {HttpErrorResponse} error
   * @returns {any}
   */
  private getHttpErrorType(error: HttpErrorResponse) {
    let errorType = ErrorHandlerService.UNAVAILABLE;

    if (error.status) {
      // Fatal / Server 5xx
      if (/^[5][0-9][0-9]/.test(error.status.toString())) {
        if (error.status === 500 && error.error) {
          errorType = ErrorHandlerService.VALIDATION;
        } else {
          errorType = ErrorHandlerService.FATAL;
        }
      } else if (/^[4][0-9][0-9]/.test(error.status.toString())) {
        // Non-fatal / Client 4xx
        if (error.error) {
          errorType = ErrorHandlerService.NON_FATAL;
        }
      } else if (/^[1][0-9][0-9]/.test(error.status.toString())) {
        // Informational / Client 1xx
        if (error.error) {
          errorType = ErrorHandlerService.INFORMATIONAL;
        }
      }
    }
    return errorType;
  }

  private getUrlErrorType(error: HttpErrorResponse) {
    let result = ErrorHandlerService.UNAVAILABLE;
    let tokens;
    let errorTypes;
    if (error.url && (error.statusText === 'Unknown Error')) {
      tokens = error.url.split('/');
      errorTypes = tokens.filter(token => (this.urlErrorTypes.indexOf(token) !== -1));
      if (errorTypes.length) {
        result = errorTypes[0];
      }
    }
    return result;
  }

  private getDetails(error: HttpErrorResponse) {
    return 'URL: ' + error.url;
  }

  private checkNo401Redirect(error: HttpErrorResponse) {
    if (error.status !== 401) {
      return false;
    }

    const headers = error.headers;

    if (headers.has(ErrorHandlerService.NO_REDIRECT_HEADER)) {
      return headers.get(ErrorHandlerService.NO_REDIRECT_HEADER);
    }
    return false;
  }
}
