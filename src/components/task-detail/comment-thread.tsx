"use client";

import { useState } from "react";
import { addComment } from "@/lib/actions/comment.actions";
import type { Comment } from "@/types/task.types";

interface CommentThreadProps {
  taskId: string;
  comments: Comment[];
}

export function CommentThread({ taskId, comments }: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({ taskId, body: newComment.trim() });
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const sortedComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedComments.map((comment) => (
        <div key={comment.id} className="flex gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-on-primary shrink-0">
            {comment.authorId.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-on-surface">{comment.authorId.slice(0, 8)}</span>
              <span className="text-[10px] text-on-surface-variant">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{comment.body}</p>
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
}
