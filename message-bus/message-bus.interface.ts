import { NotificationDialog, NotificationStatus } from '@lexus/core/services/src/lib/notification/notification.interface';

export interface IMessage {
  pubsub: string;
  data: any;
}

/**
 * Notification Service Event Message
 */
export interface INotificationMessage {
  pubsub: string;
  data: NotificationDialog | NotificationStatus;
}
