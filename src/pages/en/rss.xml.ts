import type { APIContext } from 'astro';
import { feedFor } from '../../utils/feed';

export async function GET(context: APIContext) {
  return feedFor('en', context);
}
