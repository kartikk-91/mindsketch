import { useSWRConfig } from "swr";
import { boardKey } from "./use-board";

interface Board {
  id: string;
  isFavorite: boolean;
  [key: string]: unknown;
}

export function useFavoriteBoard() {
  const { cache, mutate } = useSWRConfig();

  const updateBoardLists = async (id: string, isFavorite: boolean) => {
    const cacheMap = cache as Map<string, { data?: unknown }>;

    const sourceBoard = Array.from(cacheMap.entries())
      .filter(([key]) => typeof key === "string" && key.startsWith("/api/boards?"))
      .flatMap(([, entry]) => (Array.isArray(entry?.data) ? (entry.data as Board[]) : []))
      .find((board) => board.id === id);

    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/boards?"),
      (boards: Board[] | undefined, key?: string) => {
        if (!boards) return boards;
        const favoritesView = key ? new URLSearchParams(key.split("?")[1]).get("favorites") === "true" : false;
        if (favoritesView && !isFavorite) return boards.filter((board) => board.id !== id);
        const existing = boards.find((board) => board.id === id);
        if (existing) return boards.map((board) => board.id === id ? { ...board, isFavorite } : board);
        if (favoritesView && isFavorite && sourceBoard) return [{ ...sourceBoard, isFavorite: true }, ...boards];
        return boards;
      },
      false
    );
  };

  const favorite = async (id: string, orgId: string) => {
    await updateBoardLists(id, true);

    await mutate(
      boardKey(id),
      (board: Board | undefined) => {
        if (!board) return board;
        return { ...board, isFavorite: true };
      },
      false
    );

    try {
      const response = await fetch(`/api/boards/${id}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to favorite board");
      }
    } catch (error) {
      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/boards?"),
        undefined,
        { revalidate: true }
      );
      await mutate(boardKey(id));
      throw error;
    }
  };

  const unfavorite = async (id: string) => {
    await updateBoardLists(id, false);

    await mutate(
      boardKey(id),
      (board: Board | undefined) => {
        if (!board) return board;
        return { ...board, isFavorite: false };
      },
      false
    );

    try {
      const response = await fetch(`/api/boards/${id}/favorite`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unfavorite board");
      }
    } catch (error) {
      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/boards?"),
        undefined,
        { revalidate: true }
      );
      await mutate(boardKey(id));
      throw error;
    }
  };

  return { favorite, unfavorite };
}