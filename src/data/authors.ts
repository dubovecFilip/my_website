// Add more authors here later (e.g. for reader-submitted articles).
export const authors = {
  boggelino: { name: 'BOGGELINO', avatar: '/images/mascot.png' },
} as const;

export type AuthorId = keyof typeof authors;
export const defaultAuthor: AuthorId = 'boggelino';
