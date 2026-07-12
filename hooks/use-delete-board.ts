import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { boardKey } from "./use-board";

export function useDeleteBoard() {
  const { mutate } = useSWRConfig();

  const deleteBoard = async (id: string) => {
    await mutate(
      (key) => typeof key === "string" && key.startsWith("/api/boards?"),
      (boards: any[] | undefined) => {
        if (!boards) return boards;
        return boards.filter((b: any) => b.id !== id);
      },
      false
    );

    await mutate(boardKey(id), undefined, false);

    try {
      const response = await fetch(`/api/boards/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete board");
      }

      await mutate(
        (key) => typeof key === "string" && key.startsWith("/api/boards?"),
        undefined,
        { revalidate: true }
      );
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

  return { deleteBoard };
}