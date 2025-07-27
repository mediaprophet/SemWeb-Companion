// src/utils/n3_data_converter.js
// Modern port of legacy N3DataConverter

export class N3DataConverter {
  constructor(options) {
    this._LiteralMatcher = /^"([^]*)"(?:\^\^(.+)|@([\-a-z]+))?$/i;
    this.RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    this.RDF_TYPE = this.RDF_PREFIX + 'type';
    this.xsdString = 'http://www.w3.org/2001/XMLSchema#string';
    this.output = [];
  }

  _IriOrBlank(entity) {
    if (entity.termType !== 'NamedNode')
      return 'id' in entity ? entity.id : '_:' + entity.value;
    return entity.value;
  }

  addTriple(n_subj, n_pred, n_obj) {
    let s = null;
    let subj = this._IriOrBlank(n_subj);
    let pred = this._IriOrBlank(n_pred);
    let obj = (n_obj.termType === "Literal") ? n_obj.value : this._IriOrBlank(n_obj);
    for (let i = 0; i < this.output.length; i++)
      if (this.output[i].s === subj) {
        s = this.output[i];
        break;
      }
    if (s == null) {
      s = { s: subj, n: this.output.length + 1 };
      this.output.push(s);
    }
    if (s.props === undefined)
      s.props = {};
    if (s.props_obj === undefined)
      s.props_obj = {};
    let p = s.props[pred];
    let p_obj = s.props_obj[pred];
    if (p === undefined) {
      s.props[pred] = [];
      s.props_obj[pred] = {};
    }
    p = s.props[pred];
    p_obj = s.props_obj[pred];
    if (!p_obj[obj]) {
      p_obj[obj] = 1;
      if (n_obj.termType === "Literal") {
        p.push({ value: n_obj.value, type: (n_obj.datatypeString !== this.xsdString) ? n_obj.datatypeString : "", lang: n_obj.language });
      } else {
        p.push({ iri: obj });
      }
    }
  }
}
