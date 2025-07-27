// src/utils/microdata_json_converter.js
// Modern port of legacy MicrodataJSON_Converter

import { BNodeGenerator } from './bnode_generator.js';
export class MicrodataJSON_Converter {
  constructor(options = {}) {
    this._LiteralMatcher = /^"([^]*)"(?:\^\^(.+)|@([\-a-z]+))?$/i;
    this.RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    this.RDF_TYPE = this.RDF_PREFIX + 'type';
    this.output = [];
    this.baseURI = '';
    this.bnodeGen = options.bnodeGen || new BNodeGenerator();
  }

  transform(json, baseURI) {
    this.baseURI = baseURI;
    this.baseURL = new URL(baseURI);
    let out = [];
    for (let i = 0; i < json.items.length; i++) {
      const item = json.items[i];
      const rc = this.expand_item(item);
      out.push(rc.data);
      out = out.concat(rc.data_add);
    }
    // Recursively flatten nested items/objects in Microdata
    function flattenProps(obj, outArr) {
      if (obj && obj.props) {
        for (const [p, values] of Object.entries(obj.props)) {
          obj.props[p] = values.map(val => {
            if (val && typeof val === 'object' && val.items) {
              // Nested item: expand and flatten
              const rc = flattenProps(val, outArr);
              return rc;
            }
            return val;
          });
        }
      }
      if (obj && obj.items) {
        for (const sub of obj.items) {
          flattenProps(sub, outArr);
        }
      }
      outArr.push(obj);
      return obj;
    }
    let flatOut = [];
    for (const o of out) {
      flattenProps(o, flatOut);
    }
    // Remove duplicates by subject
    const seen = new Set();
    const deduped = flatOut.filter(x => {
      if (!x.s) return true;
      if (seen.has(x.s)) return false;
      seen.add(x.s);
      return true;
    });
    for (let i = 0; i < deduped.length; i++) {
      deduped[i]["n"] = i + 1;
      if (!deduped[i].s) {
        const bnode = this.bnodeGen.new();
        deduped[i]["s"] = bnode;
      }
    }
    return deduped;
  }

  new_bnode() {
    return this.bnodeGen.new();
  }

  expand_item(item) {
    const out = {};
    const out_add = [];
    const retVal = { id: null, data: {}, data_add: [] };
    let i_props = null;
    const props = {};
    let id_ns = null;
    let id_type = this.baseURI.toString();
    retVal.data = out;
    retVal.data_add = out_add;
    out["props"] = props;
    // ...existing code for type/id/properties handling, see legacy for full logic...
    // For brevity, this is a direct port of the main structure. Expand as needed for full fidelity.
    return retVal;
  }
}
