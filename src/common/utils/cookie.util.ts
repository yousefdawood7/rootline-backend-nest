export const extractSetCookies = (response: Response): string[] => {
  if (typeof response.headers.getSetCookie === 'function') {
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) {
      return cookies;
    }
  }
  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
};
