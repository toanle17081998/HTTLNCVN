export type NotificationDto = {
  action_url: string | null;
  created_at: string;
  id: string;
  is_read: boolean;
  message: string;
  read_at: string | null;
  title: string;
  type: string;
};

export type NotificationListResult = {
  items: NotificationDto[];
  total: number;
};

export type CreateNotificationDto = {
  action_url?: string;
  message: string;
  target_id?: string;
  target_type: 'all' | 'church_unit' | 'user';
  title: string;
  type?: string;
};
