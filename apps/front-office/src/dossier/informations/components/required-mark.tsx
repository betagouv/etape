/** L'étoile reste visuelle ; les lecteurs d'écran entendent la mention en clair (RGAA 11.10). */
export function RequiredMark() {
  return (
    <>
      <span aria-hidden="true" className="text-destructive">
        *
      </span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  );
}
