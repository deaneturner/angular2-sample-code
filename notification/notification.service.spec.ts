import { async, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatSnackBar, MatSnackBarModule } from '@angular/material';
import { NotificationService } from './notification.service';
import { AppConfigService, MessageBusService } from '@lexus/core/services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreSharedModule } from '@lexus/core/shared';
import { noop } from 'rxjs';

describe('NotificationService', () => {
  // services
  let service;
  let matSnackBar;
  let matDialog;
  let appConfigService;

  // mocks
  let appConfigMock;
  let dialogConfigMock;
  let statusConfigMock;

  // spies
  let snackBarSpy;
  let dialogSpy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        MatDialogModule,
        BrowserAnimationsModule,
        CoreSharedModule
      ],
      providers: [
        AppConfigService,
        NotificationService,
        MessageBusService
      ]
    });

    // services
    service = TestBed.get(NotificationService);
    matSnackBar = TestBed.get(MatSnackBar);
    matDialog = TestBed.get(MatDialog);
    appConfigService = TestBed.get(AppConfigService);

    // mocks
    // app config mock
    appConfigMock = {
      environment: {
        type: 'PROD'
      }
    };
    Object.assign(appConfigService.config, appConfigMock);

    // dialog config
    dialogConfigMock = {
      minWidth: 600,
      panelClass: 'notification-dialog',
      data: {
        icon: 'test:icon',
        title: 'test_title',
        message: 'test_message',
        details: 'test_details',
        detailsEnabled: true,
        buttons: [{
          label: 'test_label',
          action: noop
        }, {
          label: 'test_label2',
          action: noop
        }]
      }
    };

    // status config
    statusConfigMock = {
      data: {
        message: 'test_message',
        action: 'test_action'
      }
    };
  });

  describe('Notifications', () => {
    beforeEach(() => {
      // spies
      snackBarSpy = spyOn(matSnackBar, 'open').and.callThrough();
      dialogSpy = spyOn(matDialog, 'open').and.callThrough();
    });
    it('should call snack bar open', () => {
      service.openStatus({
        message: 'TEST MESSAGE'
      });
      expect(snackBarSpy).toHaveBeenCalled();
    });

    it('should call dialog open', () => {
      service.openDialog({
        message: 'TEST MESSAGE'
      });
      expect(dialogSpy).toHaveBeenCalled();
    });

    it('should populate the dialog ref to maintain single dialog instance', () => {
      expect(service.dialogRef).not.toBeDefined();
      service.openDialog({
        message: 'TEST MESSAGE'
      });
      expect(service.dialogRef).toBeDefined();
    });

    it('should remove the dialog ref to maintain single dialog instance', async(() => {
      expect(service.dialogRef).not.toBeDefined();
      service.openDialog({
        message: 'TEST MESSAGE'
      });
      expect(service.dialogRef).toBeDefined();
      service.dialogRef.afterClosed().subscribe(() => {
        expect(service.dialogRef).toBeFalsy();
      });
      service.dialogRef.close();
    }));

    describe('Dialog ', () => {
      it('should return a default configuration', () => {
        expect(service.getDialogConfig()).toBeDefined();
        const partialConfig = service.getDialogConfig(); // trouble comparing button action functions
        delete partialConfig.data.buttons[0].action;
        expect(partialConfig).toEqual({
          minWidth: 300,
          panelClass: 'notification-dialog',
          data: {
            icon: 'core:info-outline',
            title: 'Oops!',
            message: 'No message found!',
            details: '',
            detailsEnabled: (service.getDetailsEnabledFor()
              .indexOf(appConfigService.config['environment'].type) !== -1) ? true : false,
            buttons: [{
              label: 'OK'
            }]
          }
        });
      });

      it(' should apply configuration customizations onto the default config', () =>  {
        expect(service.getDialogConfig(dialogConfigMock)).toEqual(dialogConfigMock);
      });

      it(' should apply field configuration customizations onto the default config', () =>  {
        expect(service.getDialogConfig({
          data: {
            title: 'test_title',
            buttons: [{
              label: 'test_label1',
              action: noop
            }, {
              label: 'test_label2',
              action: noop
            }]
          }
        })).toEqual({
          minWidth: 300,
          panelClass: 'notification-dialog',
          data: {
            icon: 'core:info-outline',
            title: 'test_title',
            message: 'No message found!',
            details: '',
            detailsEnabled: (service.getDetailsEnabledFor()
              .indexOf(appConfigService.config['environment'].type) !== -1) ? true : false,
            buttons: [{
              label: 'test_label1',
              action: noop
            }, {
              label: 'test_label2',
              action: noop
            }]
          }
        });
      });
    });

    describe('Status ', () => {
      it('should return a default configuration', () => {
        expect(service.getStatusConfig()).toBeDefined();
      });

      it(' should apply field configuration customizations onto the default config', () =>  {
        expect(service.getStatusConfig(statusConfigMock)).toEqual({ // defaults
          message: 'test_message',
          action: 'test_action',
          config: {
            duration: 3500
          }
        });
      });
    });
  });
});
