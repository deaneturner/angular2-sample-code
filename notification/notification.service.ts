import { Injectable, Injector, NgZone } from '@angular/core';
import {
  MatDialog, MatDialogConfig, MatDialogRef, MatSnackBar, MatSnackBarRef, SimpleSnackBar
} from '@angular/material';
import { LxDialogComponent } from '@lexus/core/shared/src/lib/components';
import {
  NotificationDialog, NotificationDialogConfig, NotificationStatus, NotificationStatusConfig
} from './notification.interface';
import { EnvironmentService } from '../environment/environment.service';
import { NotificationEventMessage } from '../message-bus/notification-event-message';
import { AppConfigService } from '../config/app-config/app-config.service';
import { MessageBusService } from '../message-bus/message-bus.service';


/**
 * Notification Service
 *
 * **ACCESS THIS SERVICE THROUGH THE MESSAGE BUS SERVICE**
 *
 * Simple Dialog, using Notification Defaults
 * ---
 *
 * ````javascript
 * this.messageBus.publish(new NotificationEventMessage({
 *     pubsub: MessageBusService.PUBSUB.NOTIFICATION,
 *     data: NotificationService.helpers
 *     .config.getDialogNotification('Just display this simple message, with an OK button');
 * ````
 *
 * Customizated Dialog via Configuration Override
 * ---
 *
 * The config passed to the helper corresponds to the MatDialog configuration options found here:
 * [Angular Material - MatDialogConfig](https://material.angular.io/components/dialog/api#MatDialogConfig)
 *
 * ````javascript
 * this.messageBus.publish(new NotificationEventMessage({
 *     pubsub: MessageBusService.PUBSUB.NOTIFICATION,
 *     data: NotificationService.helpers.config.getDialogNotification({
 *       disableClose: true,
 *       data: {
 *         icon: 'core:alarm',
 *         templateRef: this.tpl,
 *         title: 'TITLE',
 *        message: 'MESSAGE',
 *         buttons: [{
 *           label: 'Cancel',
 *           action: () => {
 *             this.closeDialog();
 *           }
 *         }, {
 *           label: 'Submit',
 *           action: () => {
 *             console.log(this.model['url']);
 *             this.closeDialog();
 *           }
 *         }]
 *       }
 *     })
 *   }));
 *
 *
 * ````
 * Simple Status, using Notification Defaults
 * ---
 *
 * ````javascript
 * this.messageBus.publish(new NotificationEventMessage({
 *     pubsub: MessageBusService.PUBSUB.NOTIFICATION,
 *     data: NotificationService.helpers.config.getStatusNotification('Just display this simple message, with an Close button');
 * ````
 *
 * Customizated Status via Configuration Override
 * ---
 *
 * The config passed to the helper corresponds to the MatSnackbar configuration options found here:
 * [Angular Material - MatSnackbarConfig](https://material.angular.io/components/snack-bar/api#MatSnackBarConfig)
 *
 * ````javascript
 * this.messageBus.publish(new NotificationEventMessage({
 *     pubsub: MessageBusService.PUBSUB.NOTIFICATION,
 *     data: NotificationService.helpers.config.getStatusNotification({
 *       duration: 10000,
 *       panelClass: 'some-class',
 *       data: {
 *         message: 'MESSAGE'
 *       }
 *     })
 *   }));
 * ````
 */
@Injectable()
export class NotificationService {
  static TYPE_DIALOG = 'dialog';
  static TYPE_STATUS = 'status';
  static TYPE_DIALOG_CLOSE = 'close';

  /**
   * Helpers to make constructing notifications easier, especially when it just involves a simple text message.
   *
   * Available as static member e.g.
   * ````javascript
   * NotificationService.helpers.config.getStatusNotification('...');
   * ````
   *
   * Provide a message (string), and receive a notification object.
   *
   * Provide a configuration (NotificationDialogConfig (MatDialog) or NotificationStatus (MatSnackBar) configuration,
   * and receive a notification with config customizations applied.
   *
   * **Examples**
   * ````javascript
   *      NotificationService.helpers.config.getStatusNotification({
   *       duration: 10000,
   *       panelClass: 'some-class',
   *       data: {
   *         message: 'MESSAGE'
   *       }
   *     });
   * ````
   * ````javascript
   *      NotificationService.helpers.config
   *      .getStatusNotification('Just display this simple message, with an Close button');
   * ````
   *
   *
   * ````javascript
   *      NotificationService.helpers.config
   *      .getDialogNotification('Just display this simple message, with an OK button');
   * ````
   *
   * ````javascript
   *      NotificationService.helpers.config.getDialogNotification({
   *       disableClose: true,
   *       data: {
   *         icon: 'core:alarm',
   *         templateRef: this.tpl,
   *         title: 'TITLE',
   *        message: 'MESSAGE',
   *         buttons: [{
   *           label: 'Cancel',
   *           action: () => {
   *             this.closeDialog();
   *           }
   *         }, {
   *           label: 'Submit',
   *           action: () => {
   *             console.log(this.model['url']);
   *             this.closeDialog();
   *           }
   *         }]
   *       }
   *     });
   * ````
   *
   * @type {{config: {getStatusNotification: (arg: (string | NotificationStatusConfig)) => NotificationStatus;
   * getDialogNotification: (arg: (string | NotificationDialogConfig)) => NotificationDialog}}}
   */
  static helpers = {
    config: {
      getStatusNotification: (arg: string | NotificationStatusConfig): NotificationStatus => {
        let result;
        switch (typeof arg) {
          case 'string': {
            result = {
              type: NotificationService.TYPE_STATUS,
              config: {
                data: {
                  message: arg
                }
              }
            };
            break;
          }
          case 'object': {
            result = {
              type: NotificationService.TYPE_STATUS,
              config: arg
            };
            break;
          }
          default: {
            throw new Error('getStatus requires either a string message or config object.');
          }
        }

        return result;
      },
      getDialogNotification: (arg: string | NotificationDialogConfig): NotificationDialog => {
        let result;
        switch (typeof arg) {
          case 'string': {
            result = {
              type: NotificationService.TYPE_DIALOG,
              config: {
                data: {
                  message: arg
                }
              }
            };
            break;
          }
          case 'object': {
            result = {
              type: NotificationService.TYPE_DIALOG,
              config: arg
            };
            break;
          }
          default: {
            throw new Error('getDialogNotification requires either a string message or config object.');
          }
        }
        return result;
      }
    }
  };

  private statusComponent: MatSnackBar;
  private dialogComponent: MatDialog;
  private dialogRef;

  private detailsEnabledFor = [EnvironmentService.QA, EnvironmentService.DEV];

  private notification$;

  constructor(private injector: Injector,
              private ngZone: NgZone,
              private appConfigService: AppConfigService,
              private messageBusService: MessageBusService) {

    // Subscribe to notification events
    this.notification$ = this.messageBusService.of(NotificationEventMessage).subscribe(event => {
      this.handleNotificationEvent(event);
    });
  }

  /**
   * Reference to dialog modal for making calls to take action e.g. button action configuration.
   *
   * **NOTE: OPENING VIA MESSAGE BUS IS THE PRIMARY METHOD OVER THIS LOCAL METHOD CALL**
   *
   * @returns {MatDialogRef<any>}
   */
  getDialogRef(): MatDialogRef<any> {
    return this.dialogRef;
  }

  /**
   * Handle Notification Event
   *
   * To publish a notification event from a component, service, etc.:
   *
   * **Use the static helpers method to generate the NotificationDialog and NotificationStatus objects.**
   * ````javascript
   * this.messageBusService.publish(new NotificationEventMessage({
   *    pubsub: MessageBusService.PUBSUB.NOTIFICATION,
   *    data: <NotificationDialog | NotificationStatus>
   * }));
   * ````
   *
   * @param {NotificationEventMessage} event
   */
  private handleNotificationEvent(event: NotificationEventMessage): void {
    const notification = event.message.data;

    switch (notification.type) {
      case NotificationService.TYPE_DIALOG: {
        this.openDialog(this.getDialogConfig(notification.config as NotificationDialogConfig));
        break;
      }
      case NotificationService.TYPE_STATUS: {
        this.openStatus(this.getStatusConfig(notification.config as NotificationStatusConfig));
        break;
      }
      case NotificationService.TYPE_DIALOG_CLOSE: {
        this.getDialogRef().close();
        break;
      }
      default:
        throw new Error((notification.type ? notification.type : 'undefined') + ' is not a know notification type.');
    }
  }

  /**
   * ### Display a status bar (Material Snackbar).
   *
   * **NOTE: OPENING VIA MESSAGE BUS IS THE PRIMARY METHOD OVER THIS LOCAL METHOD CALL**
   *
   *   ##### Usage:
   *
   *   ![Screenshot](/screenshots/core/services/notifications/status.png)
   *
   * ** Used for direct, simple instantiation of a status bar.**
   *   ````javascript
   *     this.notificationService.openStatus({
   *       message: 'Form was submitted successfully.'})
   *   ````
   *
   * ---
   * ##### Custom:
   *
   * ![Screenshot](/screenshots/core/services/notifications/statusCustom.png)
   *
   * **Used to customize via a configuration object**
   * ````javascript
   *     this.notificationService.openStatus({
   *       message: ' A Custom Message',
   *       action: 'Custom Action'
   *     });
   * ````
   * @param {NotificationStatusConfig} config
   * @returns {MatSnackBarRef<SimpleSnackBar>}
   */
  openStatus(config: NotificationStatusConfig): MatSnackBarRef<SimpleSnackBar> {
    config = Object.assign({
      action: 'Close'
    }, config);
    let result;
    this.ngZone.run(() => {
      result = this.getStatusComponent().open(config.message, config.action, config.config);
    });
    return result;
  }

  /**
   * ### Display a modal (Material Dialog)
   *
   * **NOTE: OPENING VIA MESSAGE BUS IS THE PRIMARY METHOD OVER THIS LOCAL METHOD CALL**
   *
   * ##### Simple Default
   *
   * ![Screenshot](../../../screenshots/core/services/notifications/dialog.png)
   *
   * **Used for direct, simple instantiation of a dialog modal.**
   * ````javascript
   *   this.notificationService.openDialog({
   *     data: {
   *       message: 'Connection Timeout'
   *     }
   *   });
   * ````
   *
   * ---
   * ##### Custom
   *
   * ![Screenshot](/screenshots/core/services/notifications/dialogCustom.png)
   *
   * **Used for direct, custom instantiation of a dialog modal.**
   * ````javascript
   *      this.notificationService.openDialog({
   *         data: {
   *           title: 'Custom TITLE',
   *           subTitle: 'Custom SUBTITLE',
   *           buttons: [{
   *             label: 'OK',
   *             action: () => {
   *               this.notificationService.getDialogRef().close();
   *             }
   *           }, {
   *             label: 'Cancel',
   *             action: () => {
   *               this.notificationService.getDialogRef().close();
   *             }
   *           }]
   *         }
   *       });
   *````
   *
   *
   * @param {MatDialogConfig} config
   */
  openDialog(config?: MatDialogConfig): void {
    let result;

    if (!this.getDialogRef()) { // one dialog at a time
      this.ngZone.run(() => {
        result = this.dialogRef = this.getDialogComponent().open(LxDialogComponent, this.getDialogConfig(config));
      });

      this.dialogRef.afterClosed().subscribe(next => {
        this.dialogRef = null;
      });
    }

    return result;
  }

  /**
   * Apply a configuration over the default configuration.
   *
   * Allows customization of the dialog modal.
   *
   * @param {MatDialogConfig} config
   * @returns {MatDialogConfig}
   */
  private getDialogConfig(config?: MatDialogConfig): MatDialogConfig {
    const applyConfig: any = {};
    let result = { // defaults
      minWidth: 300,
      /* notification-dialog will not affect rendering at the local, encapsulated, component level for lx-dialog.
       * applying to the data config object within lx-dialog component will also not work.
       * Global level works but less appropriate.
       * panelClass is set here to resolve.
       */
      panelClass: 'notification-dialog',
      data: {
        icon: 'core:info-outline',
        title: 'Oops!',
        message: 'No message found!',
        details: '',
        detailsEnabled: (this.getDetailsEnabledFor().indexOf(this.appConfigService.config['environment'].type) !== -1) ? true : false,
        buttons: [{
          label: 'OK',
          action: () => this.dialogRef.close()
        }]
      }
    };
    if (config) {
      // apply data field
      Object.assign(result.data, config.data);

      // apply object
      Object.assign(applyConfig, config);
      delete applyConfig.data;
      result = Object.assign(
        result,
        applyConfig,);
    }
    return result;
  }

  /**
   * Apply a configuration over the default configuration.
   *
   * Allows customization of the status bar.
   *
   * @param {NotificationStatusConfig} config
   * @returns {NotificationStatusConfig}
   */
  private getStatusConfig(config?: NotificationStatusConfig): NotificationStatusConfig {
    const result = { // defaults
      message: '',
      action: 'Close',
      config: {
        duration: 3500
      }
    };
    if (config) {
      // apply custom config
      Object.assign(result, config['data']);
    }
    return result;
  }

  /**
   * Configuration for the environments in which notifications will have an explanding/collapsible details section.
   *
   * @returns {Array<String>}
   * @constructor
   */
  private getDetailsEnabledFor(): Array<String> {
    return this.detailsEnabledFor;
  }

  // TODO: Create interface for status component instead of MatSnackBar
  /**
   * Return the status bar instance.
   *
   * @returns {MatSnackBar}
   */
  private getStatusComponent(): MatSnackBar {
    this.statusComponent = this.statusComponent || this.injector.get(MatSnackBar);
    return this.statusComponent;
  }

  // TODO: Create interface for modal panel instead of MatDialogRef
  /**
   * Return the dialog modal instance.
   *
   * @returns {MatDialog}
   */
  private getDialogComponent(): MatDialog {
    this.dialogComponent = this.dialogComponent || this.injector.get(MatDialog);
    return this.dialogComponent;
  }
}
