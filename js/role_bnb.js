var roleURL = '/role';

var roleForm;
var roleFormData = {};
var roleObjects = {};
var onRoleSubmit = (roleFormData) => submitRoleForm(roleFormData);
const roleUIschema = {"description": {"ui:widget": "textarea"}};

var roleTableModel = {
	cols: ["Id", "Role name", "Description", "Created at", "Updated at", "Edit", "Delete"],
	rows: [],
	title: 'Roles',
	divid: 'role_list'
}

const roleSchema = {
  title: "Add new role",
  type: "object",
  required: ["role_name"],
  properties: {
	role_name: {type: "string", title: "Role name"},
	description: {type: "string", title: "Description"},
  }
};

function showRoleList()
{
	jQuery('#role_settings').show();
	jQuery('table.settings').hide();
	jQuery('#role_section').hide();
	jQuery('#role_list').show();
	jQuery('#add_role').show();
	jQuery('h1').text('Roles');
	React.render(React.createElement(Table,roleTableModel), document.getElementById('role_list_content'));
	addListButtons('role', 'showRoleForm(null)');
	
}

function showRoleForm(role)
{
	roleFormData = role;
	jQuery('#role_list').hide();
	jQuery('#role_section').show();
	jQuery('#add_role').hide();
	roleForm = React.createElement(JSONSchemaForm.default,{schema:roleSchema, uiSchema:roleUIschema, formData:roleFormData, onSubmit: onRoleSubmit});
	ReactDOM.render(roleForm,document.getElementById('role_section'));
	addBackButton('showRoleList');
}

	
function submitRoleForm(data)
{
	delete data.formData.createdAt;
	delete data.formData.updatedAt;
	addRecords('role', data, 'showRoleList');
}

function getRoles()
{
	loading('start','roles');
	stateSchema.properties.stateRoles.items.enum = [];
	userSchema.properties.role_id.enum = [];
	roleObjects = {};
	$.getJSON(apiURL + roleURL+'?t='+$.now(), function(result){
		for(i=0;i<result.length;i++){
			roleObjects[result[i].role_name] = result[i].entity_id;
			roleObjects[result[i].entity_id] = result[i].role_name;
			stateSchema.properties.stateRoles.items.enum.push(result[i].role_name);
			result[i].description = result[i].description ? result[i].description : '';
			userSchema.properties.role_id.enum.push(result[i].role_name);
			roleTableModel.rows.push(getRoleData(result[i]));
	   }
	   loading('end','roles');
	   React.render(React.createElement(Table,roleTableModel), document.getElementById('roles_list_content'));
	});
}

function getRoleData(obj)
{
	var roleData = {
		"Id": obj.entity_id,
		"Role name": obj.role_name,
		"Description": obj.description,
		"Created at": formatDate(obj.createdAt),
		"Updated at": formatDate(obj.updatedAt),
		"Edit": {"src":"/assets/img/icons/pencil.png", "width":22, "onclick":"showRoleForm("+JSON.stringify(obj)+")"},
		"Delete": {"src":"/assets/img/icons/trash.png", "width":22, "onclick":"deleteRecord('role',"+JSON.stringify(obj)+", 'role_name')"}
	};
	
	return roleData;
}