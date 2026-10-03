/**
 * Projetos na ordem da timeline: 'newest' (padrão do app) ou 'oldest' (a do enunciado da
 * disciplina). No mesmo mês vale a ordem da lista, que fica em ordem cronológica.
 */
export function sortProjects(projects, order = 'newest') {
  const oldestFirst = [...projects].sort((a, b) => a.date.localeCompare(b.date));
  return order === 'oldest' ? oldestFirst : oldestFirst.reverse();
}

/** Experiências da mais recente para a mais antiga; as atuais primeiro. */
export function sortExperiencesDescending(experiences) {
  return [...experiences].sort((a, b) => {
    const endA = a.end ?? '9999-12';
    const endB = b.end ?? '9999-12';
    return endB.localeCompare(endA) || b.start.localeCompare(a.start);
  });
}

/** Certificados do mais recente ao mais antigo. */
export function sortCertificatesDescending(certificates) {
  return [...certificates].sort(
    (a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name),
  );
}

/** Todas as tecnologias usadas nos projetos, sem repetição, em ordem alfabética. */
export function collectTechnologies(projects) {
  return [...new Set(projects.flatMap((project) => project.technologies))].sort((a, b) =>
    a.localeCompare(b),
  );
}
