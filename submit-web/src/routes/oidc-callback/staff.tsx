import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/oidc-callback/staff')({
  component: () => <div>Hello /oidc-callback/staff!</div>
})