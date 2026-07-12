import { useSWRConfig } from "swr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { boardsKey } from "./use-boards";

interface CreateBoardPayload {
  orgId: string;
  title: string;
  templateId?: string;
}

export function useCreateBoard() {
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const createBoard = async (payload: CreateBoardPayload) => {
    const response = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create board");
    }

    const board = await response.json();

    await mutate(
      (key) =>
        typeof key === "string" &&
        key.startsWith("/api/boards?") &&
        key.includes(`orgId=${payload.orgId}`),
      undefined,
      { revalidate: true }
    );

    return board;
  };

  return {
    createBoard,
  };
}