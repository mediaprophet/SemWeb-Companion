Settings 

DEFAULT TAB:
UI Terminology: (Select Box Option: Entity, Attribute, Value  OR Subject, Predicate, Object )

Preferred User ID:
Activate OSDS icon for all URLs with query segment/parameters
Auto-discovery RSS/Atom data
JSON-LD Compact To Relative
Visualize Content at Load Time
Best Effort XML to RDF Transformation
Best Effort CSV to RDF Transformation
Best Effort JSON to RDF Transformation
Upload to SPARQL

SPARQL Endpoint:	
https://linkeddata.uriburner.com/sparql
Query Timeout:	
30
  sec
Default Graph Name:	
LOD Cloud Lookup & Upload

Service Type :
URIBurner Describe TLS
URL:
https://linkeddata.uriburner.com/describe/?url={url}&sponger:get=add

Annotation (Read-Write) Service

Default Storage Document URL:
Editor Service URL: 
https://linkeddata.uriburner.com/rdf-editor/#/editor?data={data}&view=statements

 SAVE / CANCEL

 SPARQL Query 
 
 URL: ( URL Box: https://linkeddata.uriburner.com/sparql/?query={query}&format=text%2Fx-html%2Btr  by default)
Query: (dropdown box with 'Select' 'Describe' or 'construct' 

That then modifies the contents of the query box, that has line-items.

EXAMPLES:

SELECT ...
DEFINE get:soft "soft" 
SELECT (SAMPLE(?s) AS ?SubjectID) 
       (COUNT(*) AS ?count) 
       (?o AS ?SubjectTypeID) 
FROM <{url}> 
WHERE { 
        ?s a ?o . 
        FILTER (CONTAINS(STR(?o),'schema')) 
      } 
GROUP BY ?o 
ORDER BY DESC (?count) 
LIMIT 50 

OR

DESCRIBE <{url}> LIMIT 100


OR

CONSTRUCT  {<{url}> ?p ?o.   ?s ?p <{url}> .} 
WHERE {  {<{url}> ?p ?o} union {?s ?p <{url}> } } LIMIT 100





The Super Links tab states,


Query Timeout:	
30000000
 milliseconds (values less than 1000 are ignored)
SpongeMode:	

URIBurner Describe TLS

Use local Cache
Viewer:	
HTML+Faceted Browsing
Highlight mode:	
First match
Retries:	
3
Retries timeout:	
2
 secs
SPARQL query:
DEFINE get:soft "soft" 
prefix oplattr: <http://www.openlinksw.com/schema/attribution#> 
prefix schema: <http://schema.org/>  
select distinct  
       # sample(?extract) as ?sample  
       ?extract ?extractLabel  
       ?entityType bif:regexp_substr("[^/#]+$", ?entityType, 0) as ?entityTypeLabel  
       ?p as ?association ?associationLabel  
       ?provider ?providerLabel  
where  
{   
graph <{url}>   
  {     
    ?source ?p ?extract.     
    ?extract 
      a ?entityType ;    
      oplattr:providedBy ?provider ;   
      (rdfs:label | schema:name | foaf:name | schema:headline) ?extractLabel .   
    optional { ?provider foaf:name | schema:name ?providerLabel } . 
    filter (?p in ( skos:related, schema:about, schema:mentions))   
    filter (!contains(str(?entityType),"Tag"))   
  }   

● {url} token will be replaced with the URI of the current page
● {lang} token will be replaced with the browser's active UserLang (or en if unset or not detected)
ChatGPT request
   GPT Model:

GPT-3.5
Max tokens:
32000
Temperature:
1
OpenAI token:
sk-xxxxxx
Prompt:
What do you know about {words} ?
● {words} token will be replaced with the words from SuperLink item


 
 
 Super LinksLLM ChatAbout