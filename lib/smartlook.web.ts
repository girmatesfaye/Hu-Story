// Web fallback: no-op Smartlook helpers prevent native-only imports during web bundling.
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
