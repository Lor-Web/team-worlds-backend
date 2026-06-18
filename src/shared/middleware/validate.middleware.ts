import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

type ValidationSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/** Express 5: query/params — getter-only, перезаписываем через defineProperty. */
function setValidatedRequestField<K extends 'body' | 'query' | 'params'>(
  req: Request,
  key: K,
  value: Request[K],
): void {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        setValidatedRequestField(req, 'body', schemas.body.parse(req.body));
      }
      if (schemas.query) {
        setValidatedRequestField(
          req,
          'query',
          schemas.query.parse(req.query) as Request['query'],
        );
      }
      if (schemas.params) {
        setValidatedRequestField(
          req,
          'params',
          schemas.params.parse(req.params) as Request['params'],
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
