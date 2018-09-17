import { MatDialogConfig, MatSnackBarConfig } from '@angular/material';

export interface NotificationDialog {
  name?: string;
  type: string;
  config?: MatDialogConfig;
}

export interface NotificationDialogConfig extends MatDialogConfig {
  title?: string;
  subTitle?: string;
  buttons?: [
    {
      label: string;
      action(): any;
    }
  ];
}

export interface NotificationStatus {
  name?: string;
  type: string;
  config?: NotificationStatusConfig;
}

export interface NotificationStatusConfig {
  message: string;
  action?: string;
  config?: MatSnackBarConfig;
}
