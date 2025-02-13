export type Options<TData = any> = {
  onSuccess?: (data?: TData) => void;
  onError?: (error?: Error) => void;
  onSettled?: (data?: TData) => void;
};
