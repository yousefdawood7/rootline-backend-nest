import { Request } from 'express';

export const toFetchHeaders = (req: Request): Headers => {
  const headers = new Headers();
  for (const [key, val] of Object.entries(req.headers)) {
    if (val !== undefined) {
      if (Array.isArray(val)) {
        for (const item of val) {
          headers.append(key, item);
        }
      } else {
        headers.set(key, val);
      }
    }
  }
  return headers;
};
