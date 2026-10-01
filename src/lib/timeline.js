/** Projetos do mais antigo ao mais recente (ordem da timeline). */
export function sortProjectsAscending(projects) {
  return [...projects].sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/** Experiências da mais recente para a mais antiga; as atuais primeiro. */
export function sortExperiencesDescending(experiences) {
  return [...experiences].sort((a, b) => {
    const endA = a.end ?? '9999-12';
    const endB = b.end ?? '9999-12';
    return endB.localeCompare(endA) || b.start.localeCompare(a.start);
  });
}

/** Todas as tecnologias usadas nos projetos, sem repetição, em ordem alfabética. */
export function collectTechnologies(projects) {
  return [...new Set(projects.flatMap((project) => project.technologies))].sort((a, b) =>
    a.localeCompare(b),
  );
}
