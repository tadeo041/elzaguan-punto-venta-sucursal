import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Buscamos el token en el localStorage
  const token = localStorage.getItem('token');

  // 2. Si existe el token, clonamos la petición y le agregamos el Header
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. Si no hay token, dejamos pasar la petición tal cual (ej. el Login)
  return next(req);
};