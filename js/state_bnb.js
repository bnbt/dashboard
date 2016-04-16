var stateURL = '/state';
var stateObjects = {};
var stateForm;
var stateFormData = {};
var onStateSubmit = (stateFormData) => submitStateForm(stateFormData);
var openRequestStates = [];
var stateNames = {};

var stateTableModel = {
	cols: ["Id", "State name", "Color (RGB)", "Is request?", "Created at", "Updated at", "Edit", "Delete"],
	rows: [],
	title: 'States',
	divid: 'state_list'
}

const stateSchema = {
  title: "Add new state",
  type: "object",
  required: ["state_name"],
  properties: {
	state_name: {type: "string", title: "State name"},
	color: {type: "string", title: "Color (click)"},
	is_request: {type: "boolean", title: "Is the state a request type?"},
	stateRoles: {
      type: "array",
      title: "Allowed roles",
      items: {
        "type": "string",
        "enum": [],
      },
      "uniqueItems": true
    }
  }
};

function showStateList()
{
	jQuery('#state_settings').show();
	jQuery('table.settings').hide();
	jQuery('#state_section').hide();
	jQuery('#state_list').show();
	jQuery('#add_state').show();
	jQuery('h1').text('States');
	React.render(React.createElement(Table,stateTableModel), document.getElementById('state_list_content'));
	addListButtons('state', 'showStateForm(null)');
	
}

function showStateForm(state)
{
	var color = false;
	stateFormData = state;
	if(state){
		color = rgbToHex(state.red, state.green, state.blue);
		for(i=0;i<state.stateRoles.length;i++){
			var stateObj = state.stateRoles.shift();
			state.stateRoles.push(stateObj.role_name);
		}
	}
	jQuery('#state_list').hide();
	jQuery('#state_section').show();
	jQuery('#add_state').hide();
	stateForm = React.createElement(JSONSchemaForm.default,{schema:stateSchema, formData:stateFormData, onSubmit: onStateSubmit});
	ReactDOM.render(stateForm,document.getElementById('state_section'));
	if(!$('#cp').length){
		$("#root_color").wrap('<div id="cp" class="input-group colorpicker-component"></div>');
		$("#cp").append('<span class="input-group-addon"><i></i></span>');
		$("#cp").colorpicker({format:'rgb', color: color});	
	}
	addBackButton('showStateList');
}

	
function submitStateForm(data)
{
	delete data.formData.createdAt;
	delete data.formData.updatedAt;
	var colors = data.formData.color.substring(4, data.formData.color.length-1).split(','); 
	data.formData.red=colors[0];
	data.formData.green=colors[1];
	data.formData.blue=colors[2];
	var roleIds = [];
	for(var i=0;i<data.formData.stateRoles.length;i++){
		roleIds.push(roleObjects[data.formData.stateRoles[i]]);
	}
	data.formData.stateRoles = roleIds;
	addRecords('state', data, 'showStateList');
}

function getStates()
{
	loading('start','states');
	$.getJSON(apiURL + stateURL+'?t='+$.now(), function(result){
		for(i=0;i<result.length;i++){
			deviceSchema.properties.states.items.enum.push(result[i].state_name);
			stateObjects[result[i].state_name] = result[i].entity_id;
			stateObjects[result[i].entity_id] = result[i].state_name;
			if(result[i].is_request){
				openRequestStates.push(result[i].entity_id);
			}
			stateTableModel.rows.push(getStateData(result[i]));
	   }
		loading('end','states');
		getDevices();
		React.render(React.createElement(Table,stateTableModel), document.getElementById('states_list_content'));
	});
}

function getStateData(obj)
{
	var stateData = {
		"Id": obj.entity_id,
		"State name": obj.state_name,
		"Color (RGB)": { "style": '('+obj.red+","+obj.green+","+obj.blue+')'},
		"Is request?": {"src":"/assets/img/"+(obj.is_request == 'true' ? 'checked' : 'unchecked')+".png", "width":22},
		"Created at": formatDate(obj.createdAt),
		"Updated at": formatDate(obj.updatedAt),
		"Edit": {"src":"/assets/img/icons/pencil.png", "width":22, "onclick":"showStateForm("+JSON.stringify(obj)+")"},
		"Delete": {"src":"/assets/img/icons/trash.png", "width":22, "onclick":"deleteRecord('state',"+JSON.stringify(obj)+", 'state_name')"}
	};
	
	return stateData;
}