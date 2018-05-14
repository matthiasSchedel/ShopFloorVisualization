var toggle = function() {
  document.getElementById("settings").style.display =
    document.getElementById("settings").style.display == "none"
      ? "contents"
      : "none";
  document.getElementById("settings_toggle").innerHTML =
    document.getElementById("settings").style.display == "none"
      ? "Show Settings"
      : "Hide Settings";
};
var graphClient = {
  uri_names:[],
  radius: 6,
  linkDistance: 20,
  chargeDistance:50,
  debug: false,
  graph: null,
  pushLinks: true,
  uris: [],
  selectedNode: null,
  selectedNodeColor: null,
  nodes: [],
  nodecount: 0,
  linkcount: 0,
  selectionColor: "red",
  nodeColors: {
    sensor: "#039BE5",
    product: "#C0CA33",
    machine: "#5E35B1",
    sensordata: "#00ACC1",
    product_meta_data: "#D4E157",
    machine_meta_data: "#7E57C2",
    sensor_meta_data: "#29B6F6",
    sensordata_meta_data: "#26C6DA",
    production_line: "#00897B",
    product_component: "#D81B60",
    sensordata_value: "#FB8C00"
  },
  nodeRadii: {
    sensor: 9,
    product: 9,
    machine: 9,
    sensordata: 7,
    product_meta_data: 5,
    machine_meta_data: 5,
    sensor_meta_data: 5,
    sensordata_meta_data: 5,
    production_line: 13,
    product_component: 5,
    sensordata_value: 5
  }

};
graphClient.updateGraph = function(graph) {
  graphClient.graph = graph;
  modifyGraph();
  if (graphClient.debug) {
    console.log("log", graph);
  }
  
};
var width = 800.0,
  height =800.0;
var graph = {
  nodes: [],
  links: []
};
var force = d3.layout
  .force()
  .size([width, height])
  .charge(-graphClient.chargeDistance)
  .linkDistance(graphClient.linkDistance)
  .on("tick", tick);

var drag = force
  .drag()
  .on("dragstart", dragstart)
  .on("dragend", dragend);

var svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var link = svg.selectAll(".link"),
  node = svg.selectAll(".node");

var modifyGraph = function() {
  graphClient.graph.production_lines = [];
  graphClient.graph._sensors = [];
  graphClient.graph.products = [];
  graphClient.graph.product_components = [];
  graphClient.graph.sensordata = [];
  graphClient.graph.sensordata_values = [];
  graphClient.graph.machines = [];
  graphClient.graph.uri_links = [];

  for (var k = 0; k < graphClient.graph.sensors.length;k++) {
    element = graphClient.graph.sensors[k]; 
    if (element.kind == "production_line")
      graphClient.graph.production_lines.push(element);
    if (element.kind == "sensor") graphClient.graph._sensors.push(element);
    if (element.kind == "product") graphClient.graph.products.push(element);
    if (element.kind == "product_component")
      graphClient.graph.product_components.push(element);
    if (element.kind == "sensordata")
      graphClient.graph.sensordata.push(element);
    if (element.kind == "sensordata_value")
      graphClient.graph.sensordata_values.push(element);
    if (element.kind == "machine") graphClient.graph.machines.push(element);
    var links_  = [];
    for (var i = 0; i < graphClient.graph.links.length;i++)
    {
      if (graphClient.graph.links[i].source == element.name || graphClient.graph.links[i].target == element.name)
      {
          links_.push(i);
      }
    }
    graphClient.graph.uri_links[element.name] = links_;

  }
  load();
};

var load = function() {
  // d3.json("js/graph.json", function(error, graph) {
  //   if (error) throw error;
    graph = GetGraph();
    force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();
      if (graphClient.debug) {console.log("loaded nodes",graph.nodes);}
      if (graphClient.debug) {console.log("loaded links",graph.links);}
    link = link
      .data(graph.links)
      .enter()
      .append('g')
      .append("line")
      .attr("class", "link");

    node = node
      .data(graph.nodes)
      .enter()
      .append('g')
      .append("circle")
      .attr("text", "12")
      .attr("class", "node")
      .attr("r", graphClient.radius)
      .on("dblclick", dblclick)
      .call(drag);
      LoadColors();
  // });
};
function DrawLink(node, l1,l2) 
{
  var linkList = graphClient.graph.uri_links[node.name.name];
  for (var i = 0; i < linkList.length;i++) 
  {
    var s = graphClient.graph.links[linkList[i]].source;
    var t = graphClient.graph.links[linkList[i]].target;
    if (graphClient.uri_names.includes(s) && graphClient.uri_names.includes(t))
      {
        
        linkList.splice(i--,1);
        var link = { source: graphClient.nodes[s], target: graphClient.nodes[t] };
        graph.links.push(link); 
      }
  }
}

function GetGraph() {
  var angle_diff = 360.0 / graphClient.graph.production_lines.length;
  var quarter = height / 5.0;
  var center_point = { x: width / 2.0, y: height / 2.0 };
  var c = 0;
  var l1, l2, l3, l4;
  graphClient.graph.production_lines.forEach(element => {
    var angle = c++ * angle_diff;
    var x = center_point.x + Math.cos(angle * Math.PI / 180) * 200;
    var y = center_point.y + Math.sin(angle * Math.PI / 180) * 200;
    l1 = graph.nodes.length;
    graphClient.uris[l1] = graphClient.graph.production_lines[c - 1];
    graphClient.nodes[graphClient.uris[l1].name] = l1;
    graphClient.uri_names.push(graphClient.uris[l1].name);
    
    element.pos = {
      x: x,
      y: y,
      kind: "production_line",
      name: graphClient.uris[l1]
    };

    graph.nodes.push(element.pos);
    if (graphClient.pushLinks) DrawLink(element.pos, l1, l1)
    var j = 0;

    var machines_per_line =
      graphClient.graph.machines.length /
      graphClient.graph.production_lines.length;
    var angle_diff_2 = 360.0 / machines_per_line;
    for (var i0 = 0; i0 < machines_per_line; i0++) {
      angle = j++ * angle_diff_2;
      var x0 = x + Math.cos(angle * Math.PI / 180) * 30;
      var y0 = y + Math.sin(angle * Math.PI / 180) * 30;
      l2 = graph.nodes.length;
      graphClient.uris[l2] =
        graphClient.graph.machines[(c - 1) * machines_per_line + i0];
      graphClient.nodes[graphClient.uris[l2].name] = l2;
      graphClient.uri_names.push(graphClient.uris[l2].name);
      
      var node_ = {
        x: x0,
        y: y0,
        kind: "machine",
        name: graphClient.uris[l2]
      };
      graph.nodes.push(node_);
      if (graphClient.pushLinks) 
          {
            DrawLink(node_, l1,l2)
          }
    }
    var j = 0;
    var products_per_line =
      graphClient.graph.products.length /
      graphClient.graph.production_lines.length;
    var angle_diff_2 = 360.0 / products_per_line;
    for (var i3 = 0; i3 < products_per_line; i3++) {
      angle = j++ * angle_diff_2;
      var x1 = x + Math.cos(angle * Math.PI / 180) * 40;
      var y1 = y  + Math.sin(angle * Math.PI / 180) * 40;
      l2 = graph.nodes.length;
      graphClient.uris[l2] =
        graphClient.graph.products[(c - 1) * products_per_line + i3];
        graphClient.uri_names.push(graphClient.uris[l2].name);
      graphClient.nodes[graphClient.uris[l2].name] = l2;

      var node_ = {
        x: x1,
        y: y1,
        kind: "product",
        name: graphClient.uris[l2]
      };
      graph.nodes.push(node_);
      if (graphClient.pushLinks) DrawLink(node_, l1, l2);
      var product_components_per_line =
        graphClient.graph.product_components.length /
        graphClient.graph.products.length;
      var angle_diff_4 = 180.0 / product_components_per_line + 180.0;
      for (var i5 = 0; i5 < product_components_per_line; i5++) {
        angle = j++ * angle_diff_4;
        var x2 = x1 + Math.cos(angle * Math.PI / 180) * 25;
        var y2 = y1 + Math.sin(angle * Math.PI / 180) * 25;
        l3 = graph.nodes.length;
        graphClient.uris[l3] =
          graphClient.graph.product_components[
            (c - 1) * products_per_line * product_components_per_line +
              +i3 * product_components_per_line +
              i5
          ];
        graphClient.nodes[graphClient.uris[l3].name] = l3;
        graphClient.uri_names.push(graphClient.uris[l3].name);
        
        var node_ = {
          x: x2,
          y: y2,
          kind: "product_component",
          name: graphClient.uris[l3]
        };
        graph.nodes.push(node_);
        if (graphClient.pushLinks) DrawLink(node_, l2, l3)
      }
    }

    j = 0;
    var sensors_per_line =
      graphClient.graph._sensors.length /
      graphClient.graph.production_lines.length;
    angle_diff_2 = 180.0 / sensors_per_line;
    for (var i = 0; i < sensors_per_line; i++) {
      angle = j++ * angle_diff_2;
      var x1 = x + Math.cos(angle * Math.PI / 180) * 500;
      var y1 = y + Math.sin(angle * Math.PI / 180) * 500;
      l2 = graph.nodes.length;
      graphClient.uris[l2] =
        graphClient.graph._sensors[(c - 1) * sensors_per_line + i];
      graphClient.nodes[graphClient.uris[l2].name] = l2;
      graphClient.uri_names.push(graphClient.uris[l2].name);
      
      var node_ = {
        x: x1,
        y: y1,
        kind: "sensor",
        name: graphClient.uris[l2]
      };
      graph.nodes.push(node_);
      if (graphClient.pushLinks) DrawLink(node_, l1, l2)

      var sensordata_per_line =
        graphClient.graph.sensordata.length / graphClient.graph._sensors.length;
      var angle_diff_3 = 360.0 / sensordata_per_line;
      for (var i2 = 0; i2 < sensordata_per_line; i2++) {
        angle = j++ * angle_diff_3;
        var x2 = x1 + Math.cos(angle * Math.PI / 180) * 30;
        var y2 = y1 + Math.sin(angle * Math.PI / 180) * 30;
        l3 = graph.nodes.length;
        graphClient.uris[l3] =
          graphClient.graph.sensordata[
            (c - 1) * sensors_per_line * sensordata_per_line +
              i * sensordata_per_line +
              i2
          ];
        graphClient.nodes[graphClient.uris[l3].name] = l3;
        graphClient.uri_names.push(graphClient.uris[l3].name);

        var node_ = {
          x: x2,
          y: y2,
          kind: "sensordata",
          name: graphClient.uris[l3]
        };
        graph.nodes.push(node_);
        if (graphClient.pushLinks) DrawLink(node_, l2, l3)

        var sensordata_values_per_line =
          graphClient.graph.sensordata_values.length /
          graphClient.graph.sensordata.length;
        var angle_diff_4 = 360.0 / sensordata_values_per_line;
        for (var i4 = 0; i4 < sensordata_values_per_line; i4++) {
          angle = j++ * angle_diff_4;
          var x3 = x2 + Math.cos(angle * Math.PI / 180) * 20;
          var y3 = y2 + Math.sin(angle * Math.PI / 180) * 20;
          l4 = graph.nodes.length;
          
          graphClient.uris[l4] =
            graphClient.graph.sensordata_values[
              (c - 1) *
                sensordata_values_per_line *
                sensordata_per_line *
                sensors_per_line +
                i * sensordata_per_line * sensordata_values_per_line +
                +i2 * sensordata_values_per_line +
                i4
            ];
           graphClient.uri_names.push(graphClient.uris[l4].name);
          graphClient.nodes[graphClient.uris[l4].name] = l4;
          graphClient.uri_names.push(graphClient.uris[l4].name);

          var node_ = {
            x: x3,
            y: y3,
            kind: "sensordata_value",
            name: graphClient.uris[l4]
          };
          graph.nodes.push(node_);
          if (graphClient.pushLinks) DrawLink(node_, l3, l4)
        }
      }
    }
   
  });
  graphClient.nodecount = graph.nodes.length;
  graphClient.linkcount = graph.links.length;
  return graph;
}

function tick() {
  link
    .attr("x1", function(d) {
      return d.source.x;
    })
    .attr("y1", function(d) {
      return d.source.y;
    })
    .attr("x2", function(d) {
      return d.target.x;
    })
    .attr("y2", function(d) {
      return d.target.y;
    });

  node
    .attr("cx", function(d) {
      return d.x;
    })
    .attr("cy", function(d) {
      return d.y;
    });
}

function dblclick(d) {
  d3.select(this).classed("fixed", (d.fixed = !d.fixed));
}
graphClient.selectN = function(d) {
  d3.select(this).classed("selected", (d.selected = !d.selected));
}

function dragstart(d) {
  callNode(d.name.name);
  send(d.name.name);
}
function dragend(d) {}
function LoadColors() {
  node_un_checked_boxes = document.getElementById("node_checked").getElementsByTagName("label");
  for(var i = 0; i < node_un_checked_boxes.length; i++){
    var elem = node_un_checked_boxes[i];
    elem.style.background = graphClient.nodeColors[elem.id.substring(11,elem.id.length)];
  } 
  // and set text
  var nodes = document.getElementsByClassName("node");
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].style.fill = graphClient.nodeColors[nodes[i].__data__.kind];
    if (nodes[i].__data__.kind == "production_line") nodes[i].r = "12";
    if (nodes[i].__data__.kind == "sensordata_value" || nodes[i].__data__.kind == "product_component") nodes[i].r = "4";
   nodes[i].setAttribute("r", graphClient.nodeRadii[nodes[i].__data__.kind]);
  }
  var g = document.getElementsByTagName("g")[0]
  var g1 = document.getElementsByTagName("g")[1500]
}

function DrawText(g)
{
  if (g.childNodes[0].attributes.class.value == "link") 
  {
    var dx = (g.__data__.source.x + g.__data__.target.x)/2.0;
    var dy = (g.__data__.source.y + g.__data__.target.y)/2.0;
    g.innerHTML = "<text dx="+dx+" dy="+dy+" > link </text>";//
  }
  else if (g.childNodes[0].attributes.class.value == "node") console.log("circle det")
  {

  }
  
}
var not_defined;
var valid_links = 
["recorded_product"]; 
function LoadLinks() {
  graphClient.graph.uri_links.forEach(element => {
  });
}


function GetId(uri) {
  for (var i = 0; i < graphClient.uris.length; i++) {
    if (!graphClient.uris[i]) {
      not_defined.push(i);
      return "";
    }
    if (graphClient.uris[i].name == uri) return i;
  }
  return "";
}
