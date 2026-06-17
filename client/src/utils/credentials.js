const KEY = 'hk_credentials';

export const setCredentials = (creds) =>
  sessionStorage.setItem(KEY, JSON.stringify(creds));

export const getCredentials = () => {
  const c = sessionStorage.getItem(KEY);
  return c ? JSON.parse(c) : null;
};

export const clearCredentials = () =>
  sessionStorage.removeItem(KEY);

export const hasCredentials = () =>
  !!sessionStorage.getItem(KEY);
