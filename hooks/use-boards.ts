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
  backgroundPattern?: BackgroundPattern | null;
  colorTheme?: ColorTheme | null;
}

interface BoardsQuery {
  orgId: string;
  search?: string;
  favorites?: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch boards");
  }
  return res.json();
};

export function boardsKey(query: BoardsQuery): string {
  const params = new URLSearchParams({ orgId: query.orgId });
  if (query.search) params.set("search", query.search);
  if (query.favorites) params.set("favorites", "true");
  return `/api/boards?${params.toString()}`;
}

export function useBoards(query: BoardsQuery) {
  const key = boardsKey(query);

  return useSWR<Board[]>(key, fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    revalidateIfStale: true,
    dedupingInterval: 2000,
    refreshInterval: 30000,
    errorRetryCount: 3,
  });
}
