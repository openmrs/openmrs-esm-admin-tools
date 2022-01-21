export interface Subscription {
  uuid: string;
  url: string;
  token: string;
  subscribedToSnapshot?: boolean;
  validationType?: 'NONE' | 'FULL';
}
