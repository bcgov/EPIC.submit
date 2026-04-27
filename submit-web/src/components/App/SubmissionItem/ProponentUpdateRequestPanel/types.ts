import { SentRequest, PreviousRequest } from "../SectionUpdateRequestPanel/types";

export interface ProponentUpdateRequestPanelProps {
  sentRequests: SentRequest[];
  previousRequests: PreviousRequest[];
  onUpdateNote?: (itemTypeId: number, note: string) => void;
  isLoading?: boolean;
}
