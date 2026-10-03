import { describe, expect, it } from 'vitest';
import { projects } from '../../src/content/projects.js';
import {
  collectTechnologies,
  sortCertificatesDescending,
  sortExperiencesDescending,
  sortProjects,
} from '../../src/lib/timeline.js';

const project = (id, date) => ({ id, name: id, date, technologies: [] });

describe('timeline de projetos', () => {
  const input = [project('c', '2026-01'), project('a', '2024-05'), project('b', '2025-12')];

  it('por padrão, do mais recente ao mais antigo', () => {
    expect(sortProjects(input).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('oldest: do mais antigo ao mais recente (a ordem do enunciado)', () => {
    expect(sortProjects(input, 'oldest').map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('no mesmo mês, segue a ordem da lista (invertida no mais recente primeiro)', () => {
    const sameMonth = [project('x', '2026-09'), project('y', '2026-09'), project('z', '2026-08')];
    expect(sortProjects(sameMonth, 'oldest').map((p) => p.id)).toEqual(['z', 'x', 'y']);
    expect(sortProjects(sameMonth).map((p) => p.id)).toEqual(['y', 'x', 'z']);
  });

  it('não altera o array original', () => {
    const original = [project('b', '2025-01'), project('a', '2024-01')];
    sortProjects(original);
    sortProjects(original, 'oldest');
    expect(original.map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('a lista de conteúdo está em ordem cronológica (desempata o mesmo mês)', () => {
    const dates = projects.map((p) => p.date);
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

describe('certificados', () => {
  it('ordena do mais recente ao mais antigo (empate: pelo nome)', () => {
    const certificate = (name, date) => ({ id: name, name, date });
    const sorted = sortCertificatesDescending([
      certificate('B', '2026-03-10'),
      certificate('C', '2026-10-02'),
      certificate('A', '2026-03-10'),
    ]);
    expect(sorted.map((c) => c.name)).toEqual(['C', 'A', 'B']);
  });
});
