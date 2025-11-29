export interface WebSocketMessage {
  type: string;
  payload: unknown;
  action: 'create' | 'update' | 'delete';
}

export interface ItemFoodCourtUpdatePayload {
  _id: string;
  item_id: string;
  foodcourt_id: string;
  status: 'available' | 'notavailable' | 'sellingfast' | 'finishingsoon';
  price?: number;
  isActive: boolean;
  timeSlot: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketConfig {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}