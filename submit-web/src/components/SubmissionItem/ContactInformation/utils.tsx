export const PHONE_NUMBER_LENGTH = 14;

export const validatePhoneNumber = (value: string) => {
  if (!value) return false;

  // Remove underscores and check if it's complete
  const cleanValue = value.replace(/_/g, "");

  // Phone mask is "(999) 999-9999" = 14 characters (without underscores)
  return cleanValue.length === PHONE_NUMBER_LENGTH;
};
