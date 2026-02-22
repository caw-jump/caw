import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const domain =
    context.request.headers.get('x-tenant-domain') ??
    context.request.headers.get('host') ??
    'chrisamaya.work';
  context.locals.domain = domain;

  const response = await next();
  if (response.status === 200 && !context.url.pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }
  return response;
});
