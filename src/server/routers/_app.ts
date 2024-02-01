/**
 * This file contains the root router of your tRPC-backend
 */
import { router } from '../trpc';
import blocks from './blocks';

export const appRouter = router({
  blocks,
});

export type AppRouter = typeof appRouter;
