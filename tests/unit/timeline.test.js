import { describe, expect, it } from 'vitest';
import { projects } from '../../src/content/projects.js';
import {
  collectTechnologies,
  sortExperiencesDescending,
  sortProjectsAscending,
} from '../../src/lib/timeline.js';

const project = (id, date) => ({ id, name: id, date, technologies: [] });

describe('timeline de projetos', () => {
  it('ordena do mais antigo ao mais recente', () => {
    const sorted = sortProjectsAscending([
      project('c', '2026-01'),
      project('a', '2024-05'),
      project('b', '2025-12'),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('não altera o array original', () => {
    const input = [project('b', '2025-01'), project('a', '2024-01')];
    sortProjectsAscending(input);
    expect(input[0].id).toBe('b');
  });

  it('os projetos do conteúdo saem em ordem crescente de data', () => {
    const dates = sortProjectsAscending(projects).map((p) => p.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('lista as tecnologias sem repetição', () => {
    expect(
      collectTechnologies([
        { technologies: ['React', 'Vite'] },
        { technologies: ['Vite', 'Node'] },
      ]),
    ).toEqual(['Node', 'React', 'Vite']);
  });
});

describe('experiências', () => {
  it('ordena da mais recente para a mais antiga, com as atuais primeiro', () => {
    const sorted = sortExperiencesDescending([
      { id: 'old', start: '2022-01', end: '2022-06' },
      { id: 'current', start: '2024-03', end: null },
      { id: 'recent', start: '2023-01', end: '2024-01' },
    ]);
    expect(sorted.map((e) => e.id)).toEqual(['current', 'recent', 'old']);
  });
});
