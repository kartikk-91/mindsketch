import useSWR from "swr";

interface Board {
  id: string;
  title: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  orgId: string;
  isFavorite: boolean;
  templateId?: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function boardKey(boardId: string): string {
  return `/api/boards/${boardId}`;
}

export function useBoard(boardId: string) {
  return useSWR<Board>(boardId ? boardKey(boardId) : null, fetcher, {
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });
}
