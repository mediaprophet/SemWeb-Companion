import { normalizeTriples } from '../data-view/DataView.jsx';

describe('normalizeTriples', () => {
  it('parses JSON-LD triples', () => {
    const data = { '@id': 'alice', name: 'Alice', knows: { '@id': 'bob', name: 'Bob' } };
    const triples = normalizeTriples('jsonld', data);
    expect(triples).toEqual([
      ['alice', 'name', 'Alice'],
      ['alice', 'knows', 'bob'],
      ['bob', 'name', 'Bob']
    ]);
  });

  it('parses Microdata triples', () => {
    const data = { items: [ { id: 'foo', properties: { bar: ['baz'] } } ] };
    const triples = normalizeTriples('microdata', data);
    expect(triples).toEqual([
      ['foo', 'bar', 'baz']
    ]);
  });

  it('parses Turtle/N-Triples lines', () => {
    const data = ['a b c .', 'x y z .'];
    const triples = normalizeTriples('turtle', data);
    expect(triples).toEqual([
      ['a', 'b', 'c'],
      ['x', 'y', 'z']
    ]);
  });

  it('parses JSON key-value pairs', () => {
    const data = { foo: 'bar', baz: 42 };
    const triples = normalizeTriples('json', data);
    expect(triples).toEqual([
      ['root', 'foo', 'bar'],
      ['root', 'baz', 42]
    ]);
  });
});
