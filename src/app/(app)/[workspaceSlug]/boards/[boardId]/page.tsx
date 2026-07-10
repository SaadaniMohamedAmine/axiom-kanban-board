export default function BoardPage({
  params,
}: {
  params: { workspaceSlug: string; boardId: string };
}) {
  return (
    <div className="p-8">
      <h1 className="text-h2 text-on-surface mb-4">Board View</h1>
      <p className="text-body-md text-on-surface-variant">
        Board view will be implemented in T018.
      </p>
      <p className="text-body-md text-on-surface-variant mt-2">
        Workspace: {params.workspaceSlug}, Board: {params.boardId}
      </p>
    </div>
  );
}
