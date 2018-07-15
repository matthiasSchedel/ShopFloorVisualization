/*
* @Author Matthias Schedel
*/

var sparqlClient = {
    debug: false,
    callFunction: null,
    transformHandlers: [],
    graph: null,
    transformType: null,
    endpoint: null,
    query: null,
    query_url: 'http://0.0.0.0:3030/shopfloor/'
};
// query_url:"http://0.0.0.0:3030/shopfloor"
// query_url:"http://129.13.169.143:3030/shopfloor/"
// query_url:"http://192.168.0.234:3030/shopfloor/"
// Enum of transformTypes
sparqlClient.transformTypes = Object.freeze({
    GRAPH: 0,
    TABLE: 1,
    TREE: 2,
    SINGLE_TREE: 3,
    MODEL: 4
});

sparqlClient.transformHandlers[sparqlClient.transformTypes.MODEL] = function (jsonld) {
    jsonld = JSON.parse(jsonld).results.bindings;
    if (sparqlClient.debug) {
        console.log('jsonld', jsonld)
    }
    sparqlClient.graph = {
        uris: [],
        objects: []
    };

    for (var i = 0; i < jsonld.length; i++) {
        var obj = jsonld[i];
        var uri = obj[Object.keys(obj)[0]].value;
        var object = {
            id: obj[Object.keys(obj)[1]].value,
            name: uri,
            kind: Object.keys(obj)[0].toString()
        };
        sparqlClient.graph.uris[i] = uri;
        sparqlClient.graph.objects[uri] = obj;
        sparqlClient.graph.objects[i] = object
    }

    if (sparqlClient.debug) {
        console.log('Tranform finished', sparqlClient.graph)
    }
    graphClient.callFunction(sparqlClient.graph)
};

sparqlClient.transformHandlers[
    sparqlClient.transformTypes.SINGLE_TREE
    ] = function (jsonld) {
    jsonld = JSON.parse(jsonld).results.bindings;
    if (sparqlClient.debug) {
        console.log('jsonld', jsonld)
    }

    // create array that contains [ {uri, kind, tree}]
    var data = [];
    for (var i = 0; i < jsonld.length; i++) {
        var obj = jsonld[i];
        var uri = obj[Object.keys(obj)[0]].value.toString();
        var kind = Object.keys(obj)[0].toString();

        var nodeChildren = [];
        for (var j = 1; j < Object.keys(obj).length; j++) {
            var subNode = {
                name:
                Object.keys(obj)[j].toString() +
                ': ' +
                obj[Object.keys(obj)[j]].value.toString(),
                parent: uri,
                value: 1000
            };
            nodeChildren.push(subNode)
        }
        var tree = [
            {
                name: uri,
                parent: null,
                children: nodeChildren
            }
        ];
        data.push({uri: uri, kind: kind, tree: tree})
    }
    sparqlClient.callFunction(data)
};

sparqlClient.transformHandlers[sparqlClient.transformTypes.TREE] = function (jsonld) {
    jsonld = JSON.parse(jsonld).results.bindings;
    if (sparqlClient.debug) {
        console.log('jsonld', jsonld)
    }

    var sensors = [];
    var products = [];
    var sensordata = [];
    var machines = [];
    var product_components = [];
    var production_lines = [];
    var sensordata_values = [];
    for (var i = 0; i < jsonld.length; i++) {
        var obj = jsonld[i];
        var uri = obj[Object.keys(obj)[0]].value;
        var nodeChildren = [];
        for (var j = 1; j < Object.keys(obj).length; j++) {
            var subNode = {
                name:
                Object.keys(obj)[j].toString() +
                ': ' +
                obj[Object.keys(obj)[j]].value.toString(),
                parent: uri,
                value: 1000
            };
            nodeChildren.push(subNode)
        }
        var node = {
            name: uri,
            parent: Object.keys(obj)[0].toString(),
            children: nodeChildren
        };
        var nodeChildren = [];
        switch (Object.keys(obj)[0].toString()) {
            case 'sensor':
                sensors.push(node);
                break;
            case 'sensordata':
                sensordata.push(node);
                break;
            case 'machine':
                machines.push(node);
                break;
            case 'product':
                products.push(node);
                break;
            case 'product_component':
                product_components.push(node);
                break;
            case 'sensordata_value':
                sensordata_values.push(node);
                break;
            case 'production_line':
                production_lines.push(node);
                break;
            default:
                break
        }

        var data = [
            {
                name: 'shopfloor',
                parent: 'null',
                children: [
                    {name: 'sensor', parent: 'shop-floor', children: sensors},
                    {name: 'sensordata', parent: 'shop-floor', children: sensordata},
                    {name: 'machine', parent: 'shop-floor', children: machines},
                    {name: 'product', parent: 'shop-floor', children: products},
                    {name: 'sensordata_value', parent: 'shop-floor', children: sensordata_values},
                    {name: 'production_line', parent: 'shop-floor', children: production_lines},
                    {name: 'product_component', parent: 'shop-floor', children: product_components}
                ]
            }
        ]
    }
    if (sparqlClient.debug) {
        console.log('data', data)
    }
    sparqlClient.callFunction(data)
};

sparqlClient.transformHandlers[sparqlClient.transformTypes.TABLE] = function (jsonld) {
    jsonld = JSON.parse(jsonld).results.bindings;
    if (sparqlClient.debug) {
        console.log('Graph to transform:', jsonld)
    }
    sparqlClient.graph = {
        headers: [],
        data: []
    };
    // construct Elements - each key:kind, value:elements of kind
    for (var i = 0; i < jsonld.length; i++) {
        var obj = jsonld[i];
        var uri = obj[Object.keys(obj)[0]].value;
        var kind = Object.keys(obj)[0].toString();
        var exists = true;
        var found = [];
        if (!found.includes(kind.toString())) {
            var keys = [];
            for (var j = 1; j < Object.keys(obj).length; j++) {
                var key = Object.keys(obj)[j].toString();
                keys.push(key)
            }
            found.push(kind.toString());
            sparqlClient.graph.headers.push({kind: kind, values: keys})
        }
        sparqlClient.graph.data.push({uri: uri, kind: kind, values: obj})
    }
    sparqlClient.callFunction(sparqlClient.graph)
};

var constructJson = function (jsonKey, jsonValue) {
    var jsonObj = {key1: jsonValue};
    jsonObj[jsonKey] = '2';
    return jsonObj
};

sparqlClient.transformHandlers[sparqlClient.transformTypes.GRAPH] = function (jsonld) {
    if (sparqlClient.debug) {
        console.log('json:', jsonld)
    }
    jsonld = JSON.parse(jsonld).results.bindings;
    if (sparqlClient.debug) {
        console.log('Graph to transform:', jsonld)
    }
    sparqlClient.graph = {
        uris: [],
        sensors: [],
        links: []
    };

    for (var i = 0; i < jsonld.length; i++) {
        var obj = jsonld[i];
        var uri = obj[Object.keys(obj)[0]].value;
        if (sparqlClient.debug) {
            console.log('Object.keys(obj)[0]', Object.keys(obj)[0])
        }
        var node = {
            id: obj[Object.keys(obj)[1]].value,
            name: uri,
            kind: Object.keys(obj)[0].toString(),
            elemType: 'node'
        };
        var link = null;
        sparqlClient.graph.uris[i] = uri;
        sparqlClient.graph.sensors[uri] = obj;
        sparqlClient.graph.sensors[i] = node;
        if (sparqlClient.debug) {
            console.log('Object.keys(obj)', Object.keys(obj))
        }

        for (var j = 1; j < Object.keys(obj).length; j++) {
            if (obj[Object.keys(obj)[j]].type == 'uri') {
                link = {
                    source: obj[Object.keys(obj)[0]].value.toString(),
                    text: Object.keys(obj)[j].toString(),
                    target: obj[Object.keys(obj)[j]].value.toString(),
                    elemType: 'link'
                };
                sparqlClient.graph.links.push(link)
            }
        }
    }

    if (sparqlClient.debug) {
        for (var i = 0; i < sparqlClient.graph.links.length; i++) {
            if (
                !sparqlClient.graph.uris.includes(sparqlClient.graph.links[i].target)
            ) {
                console.log('Does not include:', sparqlClient.graph.links[i].target);
                console.log('With source:', sparqlClient.graph.links[i].source)
            }
            if (
                !sparqlClient.graph.uris.includes(sparqlClient.graph.links[i].source)
            ) {
                console.log('Does not include:', sparqlClient.graph.links[i].source);
                console.log('With target:', sparqlClient.graph.links[i].target)
            }
        }
    }

    if (sparqlClient.debug) {
        console.log('Graph.sensors');
        console.log('Graph.nodes:', sparqlClient.graph.sensors)
    }

    graphClient.updateGraph(sparqlClient.graph)
};
sparqlClient.doSparqlQuery = function (endpoint, query, callback, callback2) {
    var url = endpoint + '?query=' + encodeURIComponent(query);
    if (sparqlClient.debug) {
        console.log(url)
    }
    var mime = 'application/sparql-results+json';
    d3
        .request(url)
        .mimeType(mime)
        .response(function (xhr) {
            callback(xhr.responseText)
        })
        .get(callback2)
};

var numberOfInstances = function (array, instance) {
    var numOfTrue = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] == instance) numOfTrue++
    }
    return numOfTrue
};

sparqlClient.start = function (updateData) {
    var sparqlQuery = `PREFIX shopfloor: <http://scale-it.org/shopfloor#>
   
   SELECT *
   WHERE { 
    { 
     ?sensor a shopfloor:sensor.
     ?sensor shopfloor:id ?sensor_id.
     ?sensor shopfloor:version ?sensor_version
     }
     UNION
     {
       ?sensordata a shopfloor:sensordata.
       ?sensordata shopfloor:id ?sensordata_id.
       ?sensordata shopfloor:produced_by ?sensordata_sensor.
       ?sensordata shopfloor:data_of_product ?recorded_product.
       ?sensordata shopfloor:humidity ?humidity.
       ?sensordata shopfloor:temperature ?temperature.
       ?sensordata shopfloor:error_code ?error_code.
       ?sensordata shopfloor:dateTime ?time_stamp.
       ?sensordata shopfloor:version ?sensordata_version
     }
     UNION
     {
       ?product a shopfloor:product.
       ?product shopfloor:id ?product_id.
       ?product shopfloor:version ?product_version.
       ?product shopfloor:has_line ?product_line_number.
       ?product shopfloor:produced_by ?processed_by_machine
   
     } 
     UNION
     {
       ?machine a shopfloor:machine.
       ?machine shopfloor:id ?machine_id.
       ?machine shopfloor:has_line ?machine_line_number.
       ?machine shopfloor:version ?machine_version
     }
     UNION 
     {
       ?sensordata_value a shopfloor:sensordata_value.
       ?sensordata_value shopfloor:id ?sensordata_value_id.
       ?sensordata_value shopfloor:x_shift ?x_shift.
       ?sensordata_value shopfloor:y_shift ?y_shift.
       ?sensordata_value shopfloor:rotation ?rotation.
       ?sensordata_value shopfloor:component_of ?part_of_sensordata
       
     }
     UNION 
     {
       ?product_component a shopfloor:component.
       ?product_component shopfloor:id ?product_component_id.
       ?product_component shopfloor:component_of ?component_of_product.
       ?product_component shopfloor:version ?product_component_version
     }
     UNION
     {
         ?production_line a shopfloor:production_line.
         ?production_line shopfloor:id ?production_line_id
     }
   } `;

    var endpoint = sparqlClient.query_url;
    var caller = function (result) {
        if (sparqlClient.debug) {
            console.log('Caller 2 called')
        }
    };

    sparqlClient.doSparqlQuery(endpoint, sparqlQuery, updateData, caller)
};
sparqlClient.call = function (TransformType, callback) {
    switch (TransformType) {
        case sparqlClient.transformTypes.GRAPH:
            if (sparqlClient.debug) {
                console.log('GRAPH')
            }
            break;
        case sparqlClient.transformTypes.TREE:
            if (sparqlClient.debug) {
                console.log('TREE')
            }
            break;
        case sparqlClient.transformTypes.TABLE:
            if (sparqlClient.debug) {
                console.log('TABLE')
            }
            break;
        case sparqlClient.transformTypes.SINGLE_TREE:
            if (sparqlClient.debug) {
                console.log('SINGLE_TREE')
            }
            break;
        case sparqlClient.transformTypes.MODEL:
            if (sparqlClient.debug) {
                console.log('MODEL')
            }
            break;
        default:
            console.error('invalid transformType');
            return
    }
    sparqlClient.callFunction = callback;
    sparqlClient.start(sparqlClient.transformHandlers[TransformType])
};
