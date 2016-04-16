var deviceURL = '/device';
var statesURL = '/state';
var deviceForm;
var deviceStates = [];
const deviceUIschema = {"description": {"ui:widget": "textarea"}};
var deviceFormData = {};
var onSubmit = (deviceFormData) => submitDeviceForm(deviceFormData);
const log = (type) => console.log.bind(console, type);
var deviceObjects = {};
var deviceIdName = {};
var requestTableModel = {
	cols: ["Device", "State", "Request date", "Requested by"],
	rows: [],
	title: 'Open requests',
	divid: 'open_request_list'
};
var roomTableModel = {
	cols: ["Room", "Available", "Occupied by", "Time"],
	rows: [],
	title: 'Room availability',
	divid: 'room_list'
};

var deviceTableModel = {
	cols: ["Id", "Active", "Name", "Current state", "Last state change", "Last changed by","Description", "Requires RFID?", "Created at", "Updated at", "Edit", "Delete"],
		rows: [],
	title: 'Devices/Buttons',
	divid: 'device_list'
}

const deviceSchema = {
  title: "Device",
  type: "object",
  required: ["name"],
  properties: {
	device_id: {type: "string", title: "Device unique Id", default: ''},
	name: {type: "string", title: "Device name"},
	requires_rfid: {type: "boolean", title: "Requires RFID confirmation"},
	active: {type: "boolean", title: "Active"},
	description: {type: "string", title: "Description"},
    current_state: {
      type: "string",
      title: "Current state",
      enum: []
    },
    states: {
      type: "array",
      title: "Possible states in order of appearance",
      items: {
        "type": "string",
        "enum": [],
      },
      "uniqueItems": true
    }
  }
};

function showDeviceList()
{
	jQuery('#device_settings').show();
	jQuery('table.settings').hide();
	jQuery('#device_section').hide();
	jQuery('#device_list').show();
	jQuery('#add_device').show();
	jQuery('h1').text('Devices');
	//React.render(React.createElement(Table,deviceTableModel), document.getElementById('device_list_content'));
	addListButtons('device', 'showDeviceForm(null)');
}

function addPossibleState(states)
{
	for(var i=0;i<states.length;i++)
	{
	if($('#ordered_list').has("li:contains('" + states[i] + "')").length == 0){
		$('#ordered_list').append('<li class="list-group-item">' + states[i] + '<a href="javascript:void(0)" onClick="$(this).parent().remove()"><span class="glyphicon glyphicon-remove"></span></a></li>');
	}
	}
}

function showDeviceForm(device)
{
	var devicePossibleStates = [];
	if(device && device.requires_rfid && $.isNumeric(device.requires_rfid)){
		device.requires_rfid = (device.requires_rfid || device.requires_rfid == 1) ? true : false;
	}
	if(device && device.active && $.isNumeric(device.active)){
		device.active = (device.active || device.active == 1) ? true : false;
	}
	if(device && device.current_state && $.isNumeric(device.current_state)){
		device.current_state = stateObjects[device.current_state];
	}
	
	if($('#ordered_list').length>0){
		$('#ordered_list').html(''); 
	}
	deviceFormData = device;
	if(device){
		deviceSchema.properties.current_state.enum = [];
		if(device.deviceStates && device.deviceStates.length > 0){
			for(i=0;i<device.deviceStates.length;i++ ){
				deviceSchema.properties.states.items.enum.push(device.deviceStates[i].state_name);
				deviceSchema.properties.current_state.enum.push(device.deviceStates[i].state_name);
				devicePossibleStates.push(device.deviceStates[i].state_name);
			}
		}
	}
	else{
		deviceSchema.properties.current_state.enum = ['First available state will be saved'];
	}

	jQuery('#device_list').hide();
	jQuery('#device_section').show();
	jQuery('#add_device').hide();
	deviceForm = React.createElement(JSONSchemaForm.default,{schema:deviceSchema, formData:deviceFormData, uiSchema:deviceUIschema, onSubmit: onSubmit});
	ReactDOM.render(deviceForm,document.getElementById('device_section'));
	
	//show order list:
	$('#root_states').css('width','50%');
	if(!$('#ordered_list').length){
		$('#root_states').before('<div class="container order_list"><div class="panel panel-default"><div class="panel-heading">Order of statuses (in which they are saved)</div><ol class="list-group" id="ordered_list"></ol></div></div>');
	}
	addPossibleState(devicePossibleStates);
	
	
	
	//bind onclick to add order
	$("#root_states option").click(function() {
		var clickedOption = $(this);
		if(clickedOption[0].selected){
			addPossibleState([clickedOption[0].value]);
		}
		else{
			$( "#ordered_list li" ).each(function( index, element) {
				if($(element).text() == clickedOption[0].value){
					$(element).remove();
				}
			});
		}
	});
	
	addBackButton('showDeviceList');
}

function submitDeviceForm(data)
{
	if(data.formData.current_state != 'First available state will be saved'){
		data.formData.current_state = stateObjects[data.formData.current_state];
	}
	data.formData.deviceStates = [];
	//data.formData.states = [];
	$( "#ordered_list li" ).each(function( index, element) {
		if(index == 0 && data.formData.current_state == 'First available state will be saved'){
			data.formData.current_state=stateObjects[$(element).text()];
		}
		data.formData.deviceStates.push(stateObjects[$(element).text()]); 
	});
	addRecords('device', data, 'showDeviceList');
}

function getDevices()
{
	loading('start','devices');
	$.getJSON(apiURL + deviceURL+'?t='+$.now(), function(result){
		for(i=0;i<result.length;i++){
			deviceIdName[result[i].entity_id] = result[i].name;
			result[i].requires_rfid = result[i].requires_rfid ? true: false;
			result[i].active = result[i].active ? true: false;
			if(result[i].current_state && openRequestStates.indexOf(result[i].current_state) >= 0){
				requestTableModel.rows.push(getDashboardOpenRequests(result[i]));
			}
			deviceTableModel.rows.push(getDeviceData(result[i]));
	   }
		loading('end','devices');
		getAudits();
		React.render(React.createElement(Table,deviceTableModel), document.getElementById('device_list_content_index'));
		React.render(React.createElement(Table,deviceTableModel), document.getElementById('device_list_content_settings'));
	    if(!backend){
			React.render(React.createElement(Table,requestTableModel), document.getElementById('open_request_list_content'));
	    }
	});
}

function getDashboardOpenRequests(obj)
{
	var deviceData = {
		"Id": obj.entity_id,
		"Device": obj.name,
		"State": stateObjects[obj.current_state],
		"Request date": obj.last_request_date ? formatDate(obj.last_request_date) : 'N/A',
		"Requested by": obj.last_request_user ? obj.last_request_user : 'N/A'
	}
	
	return deviceData;
}

function getDeviceData(obj)
{
	var deviceData = {
		"Id": obj.entity_id,
		"Active": {"src":"/assets/img/"+(obj.active ? 'checked' : 'unchecked')+".png", "width":22},
		"Name": obj.name,
		"Current state": obj.current_state ? stateObjects[obj.current_state] : 'N/A',
		"Last state change": obj.last_request_date ? formatDate(obj.last_request_date) : 'N/A',
		"Last changed by": obj.last_request_user ? getNameByAd(userObjects[obj.last_request_user]) : 'N/A'};
		deviceData["Description"] = obj.description;
		deviceData["Requires RFID?"] = obj.requires_rfid ? "Yes" : "No";
		deviceData["Created at"] = formatDate(obj.createdAt);
		deviceData["Updated at"] = formatDate(obj.updatedAt);
		deviceData["Edit"] = {"src":"/assets/img/icons/pencil.png", "width":22, "onclick":"showDeviceForm("+JSON.stringify(obj)+")"};
		deviceData["Delete"] = {"src":"/assets/img/icons/trash.png", "width":22, "onclick":"deleteRecord('device',"+JSON.stringify(obj)+", 'device_id')"};
	
	return deviceData;
}

function getDeviceStates()
{
	$.getJSON(apiURL + statesURL, function(result){
		for(i=0;i<result.length;i++){
			deviceStates.push(result[i].state_name);
	   }
	   deviceSchema.properties.states.items.enum = deviceStates;
	   //React.render(React.createElement(Table,deviceTableModel), document.getElementById('devices_list_content'));
	});
}