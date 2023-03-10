import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';
import { User } from '../interfaces/user';

// array in local storage for registered users
let users = JSON.parse(localStorage.getItem('users') as string) || [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const { url, method, headers, body } = request;

    // wrap in delayed observable to simulate server api call
    return of(null)
      .pipe(mergeMap(handleRoute))
      .pipe(materialize())
      .pipe(delay(500))
      .pipe(dematerialize());

    function handleRoute() {
      console.log(url);
      switch (true) {
        case url.endsWith('/users/authenticate') && method === 'POST':
          return authenticate(body);
        case url.endsWith('/users/register') && method === 'POST':
          return register(body);
        case url.endsWith('/users') && method === 'GET':
          return getUsers();
        case url.match(/\/users\/\d+$/) && method === 'DELETE':
          return deleteUser();
        default:
          // pass through any requests not handled above
          return next.handle(request);
      }
    }

    // route functions

    function authenticate(body: any) {
      const { username, password } = body;
      const user = users.find((x: User) => x.username === username && x.password === password);
      if (!user) return error('Username or password is incorrect');
      return ok({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        token: 'fake-jwt-token'
      })
    }

    function register(body: any) {

      const user = body;

      if (users.find((x: User) => x.username === user.username)) {
        return error('Username "' + user.username + '" is already taken')
      }

      user.id = users.length ? Math.max(...users.map((x: User) => x.id)) + 1 : 1;
      users.push(user);
      localStorage.setItem('users', JSON.stringify(users));

      return ok(null);
    }

    function getUsers() {
      if (!isLoggedIn()) return unauthorized();
      return ok(users);
    }

    function deleteUser() {
      if (!isLoggedIn()) return unauthorized();

      users = users.filter((x: User) => x.id !== idFromUrl());
      localStorage.setItem('users', JSON.stringify(users));
      return ok(null);
    }

    // helper functions

    function ok(body: any) {
      return of(new HttpResponse({ status: 200, body }))
    }

    function error(message: string) {
      return throwError({ error: { message } });
    }

    function unauthorized() {
      return throwError({ status: 401, error: { message: 'Unauthorised' } });
    }

    function isLoggedIn() {
      return headers.get('Authorization') === 'Bearer fake-jwt-token';
    }

    function idFromUrl() {
      const urlParts = url.split('/');
      return parseInt(urlParts[urlParts.length - 1]);
    }
  }
}

export const fakeBackendProvider = {
  // use fake backend in place of Http service for backend-less development
  provide: HTTP_INTERCEPTORS,
  useClass: FakeBackendInterceptor,
  multi: true
};
