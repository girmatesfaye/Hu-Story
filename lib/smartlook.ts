// Smartlook disabled: keep a stable facade so callsites don't change.
// This prevents Android build failures caused by incompatible native SDKs.
export const initSmartlook = async () => {};

export const identifySmartlookUser = async (_user: {
  id?: string | null;
  email?: string | null;
}) => {};

export const trackSmartlookScreen = async (_pathname: string | null) => {};

export const trackSmartlookEvent = async (
  _eventName: string,
  _props?: Record<string, string | number | boolean | null | undefined>,
) => {};
