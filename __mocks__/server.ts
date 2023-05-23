import { setupServer } from 'msw/node'
import { handlers } from './handler'

// Setup requests interception using the given handlers.
export const server = setupServer(...handlers)
