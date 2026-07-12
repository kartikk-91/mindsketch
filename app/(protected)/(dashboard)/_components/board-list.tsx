"use client";

import { EmptyBoards } from "./empty-boards-new";
import { EmptyFavorites } from "./empty-favorites";
import { EmptySearch } from "./empty-search";
import { BoardGrid } from "./board-grid";
import { TemplateStrip } from "./template-strip";
import { NewBoardSlot } from "./new-board-slot";
import { useBoards } from "@/hooks/use-boards";

interface BoardListProps {
  orgId: string;
  query: {
    search?: string;
    favorites?: boolean;
  };
}

export const BoardList = ({ orgId, query }: BoardListProps) => {
  const { data: boards = [], isLoading: loading } = useBoards({
    orgId,
    search: query.search,
    favorites: query.favorites,
  });
  const isFavorites = query.favorites === true;
  const isSearching = !!query.search;

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <div className="h-7 w-48 bg-[#EEEEEE] rounded animate-pulse mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <BoardGrid.Skeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!boards.length && isSearching) return <EmptySearch />;
  if (!boards.length && isFavorites) return <EmptyFavorites />;
  if (!boards.length && !isSearching) return <EmptyBoards orgId={orgId} />;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto">

      
      {!isSearching && !isFavorites && (
        <TemplateStrip orgId={orgId} />
      )}

      
      <BoardGrid
        title={
          isFavorites
            ? "Favorite boards"
            : isSearching
            ? `Results for "${query.search}"`
            : "All boards"
        }
        subtitle={
          isFavorites
            ? "Your starred boards"
            : isSearching
            ? `${boards.length} board${boards.length !== 1 ? "s" : ""} found`
            : `${boards.length} board${boards.length !== 1 ? "s" : ""}`
        }
        boards={boards}
        showCreateSlot={!isSearching && !isFavorites}
        createSlot={<NewBoardSlot orgId={orgId} />}
      />
    </div>
  );
};
