/*
* @Author Matthias Schedel
*/
var tableClient = {
    filter_column:0,
    debug: false,// set to true for showing debug information
    selected:"http://localhost/shopfloor#product03",
    selectedKind:"product",
    selectedNode: null,
    selectedColor: null,
    nodes:[],
    rows:[],
    selectionColor:"#FDD835",
    selectedRow:"",
    graph:null,
    config : {
        "selector": "#result"
    },
    nodeColors:{
        sensor:"#039BE5",
        product:"#C0CA33",
        machine:"#5E35B1",
        sensordata:"#00ACC1",
        product_meta_data:"#D4E157",
        machine_meta_data:"#7E57C2",
        sensor_meta_data:"#29B6F6",
        sensordata_meta_data:"#26C6DA",
        production_line:"#00897B",
        product_component:"#D81B60",
        sensordata_value:"#FB8C00"
    }
};


var selected = "#sparql_product";
var done = null; 

tableClient.updateData = function(data)
{
    if(tableClient.debug) console.log("update data");
    tableClient.graph = data;
    tableClient.update();
};

var filter = function () {
        var rex = new RegExp($("#filter").val(), "i");
        $(".searchable tr").hide();
        $(".searchable tr").filter(function () {
            return rex.test($("#filter").text());
        }).show();
    }(jQuery);

$(document).ready(function () {
    (function ($) {

        $("#filter").keyup(function () {
            var rex = new RegExp($(this).val(), "i");
            $(".searchable tr").hide();
            $(".searchable tr").filter(function () {
                if(tableClient.debug) console.log("col",tableClient.filter_column);
                if (tableClient.filter_column == 0) return rex.test($(this).text());
                return rex.test($(this)[0].childNodes[tableClient.filter_column - 1].__data__);
            }).show();

        });

    }(jQuery));});

FilterId = function(id)
{
    return id;
};

tableClient.onMessage = function(m) {
    if(!document.getElementById("interaction_toggle").checked) return;
    if (tableClient.selectedNode != null && tableClient.selectedNode.childNodes[0].__data__ == m) return;
    tableClient.selected = m;
    var kind;
    tableClient.graph.data.forEach(function(el){
        if (el.uri == m) kind = el.kind;
    }); 
    if (tableClient.selectedKind != kind) 
    {
        document.getElementById("filter").value = m;//;.split('app_event')[1];
        $("#filter").keyup();
       //filter();
        return;
    }
    document.getElementById("filter").value = "";
    $("#filter").keyup();
    //filter();
    ScrollToRow(m);
    tableClient.update();
};

ScrollToRow = function(m)
{
    var rows_ = document.getElementsByTagName("tr");
    for(var i = 0; i < rows_.length;i++)
    {
        if (rows_[i].getElementsByTagName("td")[0] && rows_[i].getElementsByTagName("td")[0].innerHTML == m) 
        {
            highlightRow(rows_[i]);
            rows_[i].scrollIntoView(true);
            location.hash =rows_[i]; 
        }
    }
};

var LoadOptions = function(s)
{
    var option_parent = document.getElementById('filter_selection');
    var option_rows = document.getElementById('tableId').childNodes[1].childNodes[0].childNodes;
    while(option_parent.childNodes.length > 1)
    {
        option_parent.removeChild(option_parent.childNodes[option_parent.childNodes.length - 1]);
    } 
    var o = document.createElement('option');
        o.innerHTML = 'all';
    option_parent.appendChild(o);
    for (var i = 0; i < option_rows.length; i++)
    {
        var o = document.createElement('option');
        o.innerHTML = option_rows[i].__data__;
        option_parent.appendChild(o);
    }
}

tableClient.update = function() 
{   
  
    var sel = document.getElementsByClassName("option_kind");
    var selected;
    for(var i=0; i < sel.length; i++) { if (sel[i].selected) { selected = sel[i].innerHTML; } }
    if(tableClient.selectedKind != null && tableClient.selectedKind == selected) return;
    //new kind has be selected:
    tableClient.selectedKind = selected;
    tableClient.htmltable();
    
    document.getElementById("filter").value = "";
    $("#filter").keyup();
    
};
var div_ = null;
var start_length = 0;
tableClient.htmltable = function() {
    var head = [],data = [];
    tableClient.graph.headers.forEach(function(element) {
        if (element.kind == tableClient.selectedKind) 
        {
            head = element.values;
            return;
        }
        return;
    }); 
    start_length = (start_length == 0) ? head.length : start_length;
    head.unshift(tableClient.selectedKind);
    tableClient.graph.data.forEach(function(element) {
        if (element.kind == tableClient.selectedKind) 
        {
            data.push(element.values);
            return;
        }
        return;
    }); 
    var opts = {
        "selector": "result",
        "htmlhash":"result"
    };
    var result_ = d3.select("class","result");
    div_ = document.createElement("div");
    div_.setAttribute("class", "d3sparql htmlhash");
    var div_2 = document.createElement("table");
    div_2.setAttribute("class", "table");
    div_2.setAttribute("id","tableId");
    div_.appendChild(div_2);
   
    document.getElementById("result").innerHTML = ""; 
    document.getElementById("result").appendChild(div_);
    var table = d3.select("table");
    
    var tbody = table.append("tbody").attr("class", "searchable");
    var thead = table.append("thead");
    thead.append("tr")
        .selectAll("th")
        .data(head)
        .enter()
        .append("th")
        .text(function(col) { return col; });
    var rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");
    var cells = rows.selectAll("td")
        .data(function(row) {
            return head.map(function(col) {
                return row[col].value;
            });
        }) 
        .enter()
        .append("td")
        .text(function(val) { return val; });
    table.style({
        "margin": "10px"
    });
    table.selectAll("th").style({
        "background": "#eeeeee",
        "text-transform": "capitalize",
    });
    //Add Row Handlers
    table = document.getElementById("tableId");
    tbody = table.getElementsByTagName("tbody")[0];
    rows = tbody.getElementsByTagName("tr");
    tableClient.rows = rows;
    for (i = 0; i < rows.length; i++) 
    {
        var currentRow = rows[i];
        currentRow.setAttribute("style","background:" + tableClient.nodeColors[tableClient.selectedKind]);
        var createClickHandler = 
              function(row) 
              {
                  return function() { 
                      var cell = row.getElementsByTagName("td")[0];
                      var id = cell.innerHTML;
                      highlightRow(row);
                      //alert("id:" + id);
                      frontend.doSend(id, "listView");
                  };
              };
        var cell = currentRow.getElementsByTagName("td")[0];
        var id  = cell.innerHTML;
        currentRow.onclick = createClickHandler(currentRow);
        tableClient.nodes[id] = createClickHandler(currentRow); 
    }
LoadOptions(tableClient.selectedKind);
};

var highlightRow = function(row)
{
    if (tableClient.selectedNode != null && row == tableClient.selectedNode) return;
    if (tableClient.selectedNode != null) 
    {
        tableClient.selectedNode.setAttribute("style","background:" + tableClient.nodeColors[tableClient.selectedKind]);
    }
    row.setAttribute("style","background:" + tableClient.selectionColor);
    tableClient.selectedNode = row;
};

