export default function MembersPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  return (
    <div className="p-8">
      <h1 className="text-h2 text-on-surface mb-4">Team Members</h1>
      <p className="text-body-md text-on-surface-variant">
        Member management will be implemented in T035.
      </p>
      <p className="text-body-md text-on-surface-variant mt-2">
        Workspace: {params.workspaceSlug}
      </p>
    </div>
  );
}
