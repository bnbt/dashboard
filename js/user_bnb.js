var userURL = '/user';
var ADUserURL = '/user/ad';

var userForm;
var ADUsers = {};
var userFormData = {};
var onUserSubmit = (userFormData) => submitUserForm(userFormData);
var userObjects = {};

var userTableModel = {
	cols: ["Id", "AD user", "RFID", "Registered to dashboard", "Role", "Edit", "Delete"],
	rows: [],
	title: 'Dashboard users',
	divid: 'user_list'
}

const userSchema = {
  title: "Users",
  type: "object",
  required: ["user_AD"],
  properties: {
	user_AD: {
      type: "string",
      title: "AD user",
      enum: []
    },
	rfid: {type: "number", title: "RFID"},
    role_id: {
      type: "string",
      title: "Role",
      enum: ['Select role']
    },
  }
};

function showUserList()
{
	jQuery('#user_settings').show();
	jQuery('table.settings').hide();
	jQuery('#user_section').hide();
	jQuery('#user_list').show();
	jQuery('#add_user').show();
	jQuery('h1').text('Users');
	React.render(React.createElement(Table,userTableModel), document.getElementById('user_list_content'));
	addListButtons('user', 'showUserForm(null)');
}

function showUserForm(user)
{
	userFormData = user;
	if(user && user.user_states && user.user_states.length > 0){
		for(i=0;i<user.user_states.length;i++ ){
			userSchema.properties.states.items.enum.push(user.user_states[i].state_name);
			//userSchema.properties.curent_state.enum.push(user.user_states[i].state_name);
		}
	}
	jQuery('#user_list').hide();
	jQuery('#user_section').show();
	jQuery('#add_user').hide();
	userForm = React.createElement(JSONSchemaForm.default,{schema:userSchema, formData:userFormData, onSubmit: onUserSubmit});
	ReactDOM.render(userForm,document.getElementById('user_section'));
	addBackButton('showUserList');
}

	
function submitUserForm(data)
{
	data.formData.role_id = roleObjects[data.formData.role_id];
	addRecords('user', data, 'showUserList');
}

function getUsers()
{
	loading('start','users');
	$.getJSON(apiURL + userURL+'?t='+$.now(), function(result){
		for(i=0;i<result.length;i++){
			userObjects[result[i].entity_id] = result[i].user_AD;
			
			if($.parseJSON(Cookies.get("bnb")).username == result[i].user_AD && !$.parseJSON(Cookies.get('bnb')).name){
				$('#navbar').append('<span class="logged_in navbar-brand">'+ADUsers[result[i].user_AD].name+' <a href="javascript:void(0)" onclick="logout()">[logout]</a></span>');
				var cookieData=$.parseJSON(Cookies.get('bnb'));
				cookieData.name=ADUsers[result[i].user_AD].name;
				cookieData.role=roleObjects[result[i].role_id].toLowerCase();
				Cookies.set('bnb', cookieData, { expires: 30 });
				if(result[i].role_id && roleObjects[result[i].role_id].toLowerCase() == 'admin'){
					$('#settings_menu').show();
				}
				else{
					if(backend){
						
					}
				}
			}

			var userData = {
				"Id": result[i].entity_id,
				"AD user": result[i].user_AD,
				"RFID": result[i].rfid,
				"Registered to dashboard": formatDate(result[i].createdAt),
				"Role": result[i].role_id ? roleObjects[result[i].role_id] : 'N/A',
				"Edit": {"src":"/assets/img/icons/pencil.png", "width":22, "onclick":"showUserForm("+JSON.stringify(result[i])+")"},
				"Delete": {"src":"/assets/img/icons/trash.png", "width":22, "onclick":"deleteRecord('user',"+JSON.stringify(result[i])+", 'user_id')"}
			};
			userTableModel.rows.push(userData);
			newUsersStatData["datasets"][0]["data"][new Date(result[i].createdAt).getMonth()] += 1;
	   }
		loading('end','users');
	   //getAudits();
	   getStates();
	   React.render(React.createElement(Table,userTableModel), document.getElementById('user_list_content'));
	});
}

function getADUsers()
{
	loading('start','ActiveDirectory');
	$.getJSON(apiURL + ADUserURL+'?t='+$.now(), function(result){
		for(i=0;i<result.length;i++){
		userSchema.properties.user_AD.enum.push(result[i].cn);
		ADUsers[result[i].sAMAccountName] = {
			"name":result[i].cn,
			"mail": result[i].mail
		};
	   }
	   loading('end','ActiveDirectory');
	   getUsers();
	});
}

function getNameByAd(ad)
{
	for(var i in ADUsers){
		if(i == ad){
			return ADUsers[i].name;
		}
	}
}