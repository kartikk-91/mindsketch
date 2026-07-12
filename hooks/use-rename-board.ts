import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { boardKey } from "./use-board";

export function useRenameBoard() {
  const { mutate } = useSWRConfig();

  const renameBoard = async (id: string, title: string) => {
    const trimmedTitle = title.trim();

    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/boards?"),
      (boards: any[] | undefined) => {
        if (!boards) return boards;
        return boards.map((b: any) =>
          b.id === id ? { ...b, title: trimmedTitle } : b
        );
      },
      false
    );

    await mutate(
      boardKey(id),
      (board: any) => {
        if (!board) return board;
        return { ...board, title: trimmedTitle };
      },
      false
    );

    try {
      const response = await fetch(`/api/boards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to rename board");
      }

      const updated = await response.json();

      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/boards?"),
        (boards: any[] | undefined) => {
          if (!boards) return boards;
          return boards.map((b: any) =>
            b.id === id ? { ...b, title: updated.title } : b
          );
        },
        false
      );
      await mutate(boardKey(id), updated, false);
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

  return { renameBoard };
}