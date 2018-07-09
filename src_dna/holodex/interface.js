
/*========================================
=            Public Functions            =
========================================*/

function indexKeyword({entryType, entryHash, entry=get(entryHash)}) {
  // load the entry (will have to call over bridge in bridging case)

  let entryFlat = flattenObject(entry);

  // index each of the fields that need indexing
  textSearchSpec()[entryType].indexFields.forEach(({fieldName, weight}) => {

    debug("Extracted Keywords:" + JSON.stringify(processString(entryFlat[fieldName])));

    processString(entryFlat[fieldName]).forEach(keyword => {

      debug("linking to: "+keyword);

      // create a new anchor if it doesn't exist already
      let keywordAnchorHash = commit('keywordAnchor', {
        sourceEntryHash: entryHash,
        keyword : entryType + ":" + fieldName + ":" + keyword
      });

    });
  });

  return true;
}

function index({entryType, entryHash, entry=get(entryHash)}) {
  //create a skeletal entry with the correct fields plus the hash of the original
  let skeletalEntryType = "skel_"+entryType
  let skeletalEntry = indexSpec()[entryType].reduce((obj, field) => {
    obj[field] = entry[field]
    return obj
  }, {})
  skeletalEntry.sourceEntryHash = entryHash
  commit(skeletalEntryType, skeletalEntry)
  return true
}

function queryHD({entryType, queryOptions}) {
  // get the corresponding skeleton entry type
  let skeletonEntryType = "skel_"+entryType

  return queryDHT(skeletonEntryType, queryOptions).map(Hash => {
    return get(Hash).sourceEntryHash;
  })
}

function search({entryType, queryString, options={}}) {
  // results is a dictionary mapping hashes to ranks
  let results = {};

  processString(queryString).forEach(keyword => {
    textSearchSpec()[entryType].indexFields.forEach(({fieldName, weight}) => {
      queryDHT('keywordAnchor', {
        Field: 'keyword', 
        Constrain: {EQ : entryType + ":" + fieldName + ":" + keyword}
      }).forEach((Hash) => {
        if (hashExists(Hash)) {
          let entryHash = get(Hash).sourceEntryHash
          if(results[entryHash]) {
            results[entryHash] += weight;
          } else {
            results[entryHash] = weight;
          }
        }
      });
    });
  });

  return results;

}

/*=====  End of Public Functions  ======*/

