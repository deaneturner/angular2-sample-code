import { INotificationMessage } from './message-bus.interface';

export class NotificationEventMessage {
  constructor(public message: INotificationMessage) {
  }
}
