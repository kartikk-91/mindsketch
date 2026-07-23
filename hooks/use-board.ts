import useSWR from "swr";
import { type BackgroundPattern, type ColorTheme } from "@/lib/board-appearance";

interface Board {
  id: string;
  title: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  isFavorite: boolean;
  templateId?: string | null;
  backgroundPattern?: BackgroundPattern | null;
  colorTheme?: ColorTheme | null;
}

export class BoardRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "BoardRequestError";
  }
}

const fetcher = async (url: string): Promise<Board> => {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new BoardRequestError(
      body.error ?? "Unable to load this board.",
      response.status
    );
  }

  return body;
};

export function boardKey(boardId: string): string {
  return `/api/boards/${boardId}`;
}

export function useBoard(boardId: string) {
  return useSWR<Board>(boardId ? boardKey(boardId) : null, fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    shouldRetryOnError: (error) =>
      !(error instanceof BoardRequestError) || error.status >= 500,
  });
}
