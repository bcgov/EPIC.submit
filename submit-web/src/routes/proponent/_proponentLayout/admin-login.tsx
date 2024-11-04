import { createFileRoute } from '@tanstack/react-router'

/** This url will be given to Entity Account Admins via link sent by EAO with Business BCeid. */

export const Route = createFileRoute('/proponent/_proponentLayout/admin-login')({
  component: () => <div>TODO: if isAuthenticated then redirect to home page, otherwise navigate to login again.</div>
})
