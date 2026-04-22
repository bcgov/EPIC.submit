export interface PendingRequest {
  itemTypeId: number;
  itemTypeName: string;
  reason: string;
}

export interface SentRequest {
  updateRequestId: number;
  itemTypeId: number;
  itemTypeName: string;
  note: string;
  createdDate: string;
  createdBy: string;
  status: string;
}

export interface SectionUpdateRequestPanelProps {
  pendingRequests: PendingRequest[];
  sentRequests: SentRequest[];
  onRemoveFlag: (itemTypeId: number) => void;
  onSendRequests: () => void;
  onUpdateNote: (itemTypeId: number, note: string) => void;
  isLoading?: boolean;
}
