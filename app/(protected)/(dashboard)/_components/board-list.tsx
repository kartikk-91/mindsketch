"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmptyBoards } from "./empty-boards";
import { EmptyFavorites } from "./empty-favorites";
import { EmptySearch } from "./empty-search";
import { BoardCard } from "./board-card";
import { NewBoardButton } from "./new-board-button";

interface BoardListProps {
  orgId: string;
  query: {
    search?: string;
    favorites?: true;
  };
}

export const BoardList = ({ orgId, query }: BoardListProps) => {
  const boards = useQuery(api.boards.get, { orgId, ...query });
  const templates = useQuery(api.templates.list);

  const createBoard = useMutation(api.board.create);
  const router = useRouter();

  const [creatingId, setCreatingId] = useState<string | null>(null);

  
  if (boards === undefined) {
    return (
      <div>
        <h2 className="text-3xl font-semibold">
        {query.favorites === true ? "Favorite boards" : "Team boards"}

        </h2>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-5">
          <NewBoardButton orgId={orgId} disabled />
          {Array.from({ length: 5 }).map((_, i) => (
            <BoardCard.Skeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  
  if (!boards.length && query.search) return <EmptySearch />;
  if (!boards.length && query.favorites === true) return <EmptyFavorites />;


  return (
    <div className="space-y-16">
      
      {!query.search && query.favorites !== true && (
        <section>
          <h2 className="text-3xl font-semibold">Start from a template</h2>

          <div className="relative mt-6">
            
            <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent z-10" />

            <div className="flex h-fit gap-5 overflow-x-auto pb-4 px-1 scrollbar-hide">
              
              <div className="min-w-[260px] h-full">
                <div className="h-full">
                  <NewBoardButton orgId={orgId} />
                </div>
              </div>


              
              {templates === undefined &&
                Array.from({ length: 3 }).map((_, i) => (
                  <BoardCard.Skeleton key={i} />
                ))}

              {templates?.length === 0 && (
                <div className="text-sm text-muted-foreground flex items-center px-4">
                  No templates available
                </div>
              )}

              {templates?.map((template) => (
                <div
                  key={template._id}
                  className="min-w-[260px] transition-transform "
                >
                  <button
                    className="w-full text-left"
                    disabled={creatingId === template._id}
                    onClick={async () => {
                      try {
                        setCreatingId(template._id);
                        const boardId = await createBoard({
                          title: template.name,
                          orgId,
                          templateId: template._id,
                        });
                        router.push(`/board/${boardId}`);
                      } finally {
                        setCreatingId(null);
                      }
                    }}
                  >
                    <BoardCard
                      id={template._id}
                      title={template.name}
                      imageUrl={`/images/templates/${template.thumbnail}`}
                      authorId=""
                      authorName="Template"
                      createdAt={0}
                      orgId={orgId}
                      isFavorite={false}
                      disableLink
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      
      {boards.length === 0 ? (
        <EmptyBoards />
      ) : (
        <section>
          <h2 className="text-3xl font-semibold">
            {query.favorites ? "Favorite boards" : "Team boards"}
          </h2>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 pb-10">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                id={board._id}
                title={board.title}
                imageUrl={board.imageUrl}
                authorId={board.authorId}
                authorName={board.authorName}
                createdAt={board._creationTime}
                orgId={board.orgId}
                isFavorite={board.isFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
