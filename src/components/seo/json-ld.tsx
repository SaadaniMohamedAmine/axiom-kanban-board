// Server-rendered JSON-LD script tag. `data` must already be a plain
// JSON-serializable object — no user input is accepted here, so there's no
// injection risk from JSON.stringify's output.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
