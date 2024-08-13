/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as OidcCallbackImport } from './routes/oidc-callback'
import { Route as ErrorImport } from './routes/error'
import { Route as AuthenticatedImport } from './routes/_authenticated'
import { Route as IndexImport } from './routes/index'
import { Route as AuthenticatedAdminLoginImport } from './routes/_authenticated/admin-login'
import { Route as AuthenticatedRegistrationCreateAccountImport } from './routes/_authenticated/registration/create-account'
import { Route as AuthenticatedDashboardProfileImport } from './routes/_authenticated/_dashboard/profile'
import { Route as AuthenticatedDashboardLayoutImport } from './routes/_authenticated/_dashboard/_layout'
import { Route as AuthenticatedDashboardUsersIndexImport } from './routes/_authenticated/_dashboard/users/index'
import { Route as AuthenticatedDashboardProjectsIndexImport } from './routes/_authenticated/_dashboard/projects/index'
import { Route as AuthenticatedDashboardEaoPlansIndexImport } from './routes/_authenticated/_dashboard/eao-plans/index'
import { Route as AuthenticatedDashboardEaoPlansPlanIdImport } from './routes/_authenticated/_dashboard/eao-plans/$planId'
import { Route as AuthenticatedRegistrationAccountAccountIdProjectsImport } from './routes/_authenticated/registration/account/$accountId/projects'

// Create Virtual Routes

const AuthenticatedDashboardNewpageLazyImport = createFileRoute(
  '/_authenticated/_dashboard/newpage',
)()
const AuthenticatedDashboardAboutpageLazyImport = createFileRoute(
  '/_authenticated/_dashboard/aboutpage',
)()

// Create/Update Routes

const OidcCallbackRoute = OidcCallbackImport.update({
  path: '/oidc-callback',
  getParentRoute: () => rootRoute,
} as any)

const ErrorRoute = ErrorImport.update({
  path: '/error',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedRoute = AuthenticatedImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedAdminLoginRoute = AuthenticatedAdminLoginImport.update({
  path: '/admin-login',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedDashboardNewpageLazyRoute =
  AuthenticatedDashboardNewpageLazyImport.update({
    path: '/newpage',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/_dashboard/newpage.lazy').then(
      (d) => d.Route,
    ),
  )

const AuthenticatedDashboardAboutpageLazyRoute =
  AuthenticatedDashboardAboutpageLazyImport.update({
    path: '/aboutpage',
    getParentRoute: () => AuthenticatedRoute,
  } as any).lazy(() =>
    import('./routes/_authenticated/_dashboard/aboutpage.lazy').then(
      (d) => d.Route,
    ),
  )

const AuthenticatedRegistrationCreateAccountRoute =
  AuthenticatedRegistrationCreateAccountImport.update({
    path: '/registration/create-account',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedDashboardProfileRoute =
  AuthenticatedDashboardProfileImport.update({
    path: '/profile',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedDashboardLayoutRoute =
  AuthenticatedDashboardLayoutImport.update({
    id: '/_dashboard/_layout',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedDashboardUsersIndexRoute =
  AuthenticatedDashboardUsersIndexImport.update({
    path: '/users/',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedDashboardProjectsIndexRoute =
  AuthenticatedDashboardProjectsIndexImport.update({
    path: '/projects/',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedDashboardEaoPlansIndexRoute =
  AuthenticatedDashboardEaoPlansIndexImport.update({
    path: '/eao-plans/',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedDashboardEaoPlansPlanIdRoute =
  AuthenticatedDashboardEaoPlansPlanIdImport.update({
    path: '/eao-plans/$planId',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedRegistrationAccountAccountIdProjectsRoute =
  AuthenticatedRegistrationAccountAccountIdProjectsImport.update({
    path: '/registration/account/$accountId/projects',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedImport
      parentRoute: typeof rootRoute
    }
    '/error': {
      id: '/error'
      path: '/error'
      fullPath: '/error'
      preLoaderRoute: typeof ErrorImport
      parentRoute: typeof rootRoute
    }
    '/oidc-callback': {
      id: '/oidc-callback'
      path: '/oidc-callback'
      fullPath: '/oidc-callback'
      preLoaderRoute: typeof OidcCallbackImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated/admin-login': {
      id: '/_authenticated/admin-login'
      path: '/admin-login'
      fullPath: '/admin-login'
      preLoaderRoute: typeof AuthenticatedAdminLoginImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/_layout': {
      id: '/_authenticated/_dashboard/_layout'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedDashboardLayoutImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/profile': {
      id: '/_authenticated/_dashboard/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof AuthenticatedDashboardProfileImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/registration/create-account': {
      id: '/_authenticated/registration/create-account'
      path: '/registration/create-account'
      fullPath: '/registration/create-account'
      preLoaderRoute: typeof AuthenticatedRegistrationCreateAccountImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/aboutpage': {
      id: '/_authenticated/_dashboard/aboutpage'
      path: '/aboutpage'
      fullPath: '/aboutpage'
      preLoaderRoute: typeof AuthenticatedDashboardAboutpageLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/newpage': {
      id: '/_authenticated/_dashboard/newpage'
      path: '/newpage'
      fullPath: '/newpage'
      preLoaderRoute: typeof AuthenticatedDashboardNewpageLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/eao-plans/$planId': {
      id: '/_authenticated/_dashboard/eao-plans/$planId'
      path: '/eao-plans/$planId'
      fullPath: '/eao-plans/$planId'
      preLoaderRoute: typeof AuthenticatedDashboardEaoPlansPlanIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/eao-plans/': {
      id: '/_authenticated/_dashboard/eao-plans/'
      path: '/eao-plans'
      fullPath: '/eao-plans'
      preLoaderRoute: typeof AuthenticatedDashboardEaoPlansIndexImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/projects/': {
      id: '/_authenticated/_dashboard/projects/'
      path: '/projects'
      fullPath: '/projects'
      preLoaderRoute: typeof AuthenticatedDashboardProjectsIndexImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/_dashboard/users/': {
      id: '/_authenticated/_dashboard/users/'
      path: '/users'
      fullPath: '/users'
      preLoaderRoute: typeof AuthenticatedDashboardUsersIndexImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/registration/account/$accountId/projects': {
      id: '/_authenticated/registration/account/$accountId/projects'
      path: '/registration/account/$accountId/projects'
      fullPath: '/registration/account/$accountId/projects'
      preLoaderRoute: typeof AuthenticatedRegistrationAccountAccountIdProjectsImport
      parentRoute: typeof AuthenticatedImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRoute.addChildren({
    AuthenticatedAdminLoginRoute,
    AuthenticatedDashboardProfileRoute,
    AuthenticatedRegistrationCreateAccountRoute,
    AuthenticatedDashboardAboutpageLazyRoute,
    AuthenticatedDashboardNewpageLazyRoute,
    AuthenticatedDashboardEaoPlansPlanIdRoute,
    AuthenticatedDashboardEaoPlansIndexRoute,
    AuthenticatedDashboardProjectsIndexRoute,
    AuthenticatedDashboardUsersIndexRoute,
    AuthenticatedRegistrationAccountAccountIdProjectsRoute,
  }),
  ErrorRoute,
  OidcCallbackRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_authenticated",
        "/error",
        "/oidc-callback"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_authenticated": {
      "filePath": "_authenticated.tsx",
      "children": [
        "/_authenticated/admin-login",
        "/_authenticated/_dashboard/_layout",
        "/_authenticated/_dashboard/profile",
        "/_authenticated/registration/create-account",
        "/_authenticated/_dashboard/aboutpage",
        "/_authenticated/_dashboard/newpage",
        "/_authenticated/_dashboard/eao-plans/$planId",
        "/_authenticated/_dashboard/eao-plans/",
        "/_authenticated/_dashboard/projects/",
        "/_authenticated/_dashboard/users/",
        "/_authenticated/registration/account/$accountId/projects"
      ]
    },
    "/error": {
      "filePath": "error.tsx"
    },
    "/oidc-callback": {
      "filePath": "oidc-callback.tsx"
    },
    "/_authenticated/admin-login": {
      "filePath": "_authenticated/admin-login.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/_layout": {
      "filePath": "_authenticated/_dashboard/_layout.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/profile": {
      "filePath": "_authenticated/_dashboard/profile.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/registration/create-account": {
      "filePath": "_authenticated/registration/create-account.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/aboutpage": {
      "filePath": "_authenticated/_dashboard/aboutpage.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/newpage": {
      "filePath": "_authenticated/_dashboard/newpage.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/eao-plans/$planId": {
      "filePath": "_authenticated/_dashboard/eao-plans/$planId.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/eao-plans/": {
      "filePath": "_authenticated/_dashboard/eao-plans/index.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/projects/": {
      "filePath": "_authenticated/_dashboard/projects/index.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/_dashboard/users/": {
      "filePath": "_authenticated/_dashboard/users/index.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/registration/account/$accountId/projects": {
      "filePath": "_authenticated/registration/account/$accountId/projects.tsx",
      "parent": "/_authenticated"
    }
  }
}
ROUTE_MANIFEST_END */
