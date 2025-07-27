import React from 'react';

// Utility: Extract Open Graph, Twitter Card, and JSON-LD preview data from a generic object
function extractPreviewData(data) {
  // JSON-LD: look for common types
  if (data && typeof data === 'object') {
    if (data['@type'] || data['@context']) {
      return {
        type: 'jsonld',
        title: data.name || data.headline || data.title || '',
        description: data.description || '',
        image: data.image && typeof data.image === 'object' ? (data.image.url || data.image['@id'] || data.image[0]) : data.image,
        url: data.url || data['@id'] || '',
        raw: data
      };
    }
    // Open Graph
    if (data['og:title'] || data['og:description'] || data['og:image']) {
      return {
        type: 'opengraph',
        title: data['og:title'] || '',
        description: data['og:description'] || '',
        image: data['og:image'] || '',
        url: data['og:url'] || '',
        raw: data
      };
    }
    // Twitter Card
    if (data['twitter:title'] || data['twitter:description'] || data['twitter:image']) {
      return {
        type: 'twitter',
        title: data['twitter:title'] || '',
        description: data['twitter:description'] || '',
        image: data['twitter:image'] || '',
        url: data['twitter:url'] || '',
        raw: data
      };
    }
  }
  return null;
}

export default function RichPreview({ data, style }) {
  const preview = extractPreviewData(data);
  if (!preview) return null;
  return (
    <div className="osds-rich-preview" style={{
      border: '1px solid #ccc', borderRadius: 8, padding: 16, background: '#fafbfc', maxWidth: 420, ...style
    }}>
      {preview.image && (
        <div style={{textAlign:'center',marginBottom:12}}>
          <img src={preview.image} alt="Preview" style={{maxWidth:'100%',maxHeight:180,borderRadius:6,boxShadow:'0 2px 8px #0001'}} />
        </div>
      )}
      <div style={{fontWeight:'bold',fontSize:'1.15em',marginBottom:4}}>{preview.title}</div>
      <div style={{color:'#555',marginBottom:8}}>{preview.description}</div>
      {preview.url && <div style={{fontSize:'0.97em',color:'#0074d9',wordBreak:'break-all'}}><a href={preview.url} target="_blank" rel="noopener noreferrer">{preview.url}</a></div>}
      <div style={{marginTop:8,fontSize:'0.92em',color:'#888'}}>
        {preview.type === 'jsonld' && 'JSON-LD'}
        {preview.type === 'opengraph' && 'Open Graph'}
        {preview.type === 'twitter' && 'Twitter Card'}
      </div>
    </div>
  );
}
