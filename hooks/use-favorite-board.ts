import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { boardKey } from "./use-board";

export function useFavoriteBoard() {
  const { mutate } = useSWRConfig();

  const favorite = async (id: string, orgId: string) => {
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/boards?"),
      (boards: any[] | undefined) => {
        if (!boards) return boards;
        return boards.map((b: any) =>
          b.id === id ? { ...b, isFavorite: true } : b
        );
      },
      false
    );

    await mutate(
      boardKey(id),
      (board: any) => {
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
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/boards?"),
      (boards: any[] | undefined) => {
        if (!boards) return boards;
        return boards.map((b: any) =>
          b.id === id ? { ...b, isFavorite: false } : b
        );
      },
      false
    );

    await mutate(
      boardKey(id),
      (board: any) => {
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