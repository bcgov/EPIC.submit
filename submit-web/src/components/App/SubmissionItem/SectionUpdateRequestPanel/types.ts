export interface PendingRequest {
  itemTypeId: number;
  itemTypeName: string;
  reason: string;
}

export interface SentRequest {
  updateRequestId: number;
  itemTypeId: number;
  itemTypeName: string;
  reason: string;
  createdDate: string;
  createdBy: string;
  status: string;
  note?: string;
  noteUpdatedBy?: string;
  noteUpdatedAt?: string;
}

export interface PreviousRequest {
  updateRequestId: number;
  itemTypeId: number;
  itemTypeName: string;
  reason: string;
  createdDate: string;
  createdBy: string;
  status: string;
  note?: string;
  noteUpdatedBy?: string;
  noteUpdatedAt?: string;
}

export interface SectionUpdateRequestPanelProps {
  pendingRequests: PendingRequest[];
  sentRequests: SentRequest[];
  previousRequests: PreviousRequest[];
  onRemoveFlag: (itemTypeId: number) => void;
  onSendRequests: () => void;
  onUpdateNote: (itemTypeIdOrUpdateRequestId: number, note: string) => void; // STAFF: itemTypeId | PROPONENT: updateRequestId
  onAcceptUpdate?: (updateRequestId: number) => void;
  onWithdrawUpdate?: (updateRequestId: number) => void;
  isLoading?: boolean;
  packageId: number; // Required for API calls
}
