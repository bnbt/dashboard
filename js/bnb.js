var apiURL = 'http://api.blastdev.com';
var requestTableModel;
var roomTableModel;
var socket = io('http://api.blastdev.com');
var configFormData;
var onConfigSubmit = (configFormData) => submitConfigForm(configFormData);
var ajaxCalls =6;

const configurationSchema = {
  title: "General configuration settings",
  type: "object",
  properties: {
	res_per_page: {type: "string", title: "General results per page", default: '50'},
	session_time: {type: "string", title: "Session time (days)", default: 7},
	wifi: {type: "string", title: "New wireless password"},
  }
};

var Table = React.createClass({
	componentDidMount: function(){
		if(this.props.title && this.props.divid){
			//jQuery('#'+this.props.divid).prepend('<div class="alert alert-info">'+this.props.title+'</div>');
		}
	},
    render: function render() {
        var _self = this;

        var thead = React.DOM.thead({},
            React.DOM.tr({},
                this.props.cols.map(function (col) {
                    return React.DOM.th({}, col);
            })));

        var tbody = this.props.rows.map(function (row) {
            return React.DOM.tr({},
            _self.props.cols.map(function (col) {
				var td_data = row[col] || "";
				var td_content = td_data;
				if(td_data.src){
					if(td_data.onclick){
						td_content = React.DOM.a({href:'javascript:'+td_data.onclick}, React.DOM.img({src:td_data.src, width:td_data.width}));
					}
					else {
						td_content = React.DOM.img({src:td_data.src, width:td_data.width});
					}
				}

				if(td_data.style) {
					td_content = React.DOM.svg({width: 20, height: 20},React.DOM.circle({cx: 10, cy: 10, r: 10, fill: 'rgb' + td_data.style}));
				}

				if(td_data.msg){
					td_content = [td_content, td_data.msg]
				}

                return React.DOM.td({}, td_content)
            }));
        });
		
		
        return React.DOM.table({className:'table table-bordered table-responsive table-striped'}, [thead, tbody]);
    }

});

function addBackButton(callback)
{
	if($('button.btn-cancel:visible').length == 0){
		$('<button type="button" class="btn btn-cancel btn-default" onclick="' + callback + '();">Cancel</button>').insertBefore("button[type=submit]:visible");
	}
}

function addRecords(object, data, callback)
{
	var isEdit = data.formData.entity_id > 0;
		
	$.ajax({
		url: apiURL + window[object+'URL'] + (isEdit ? ('/'+data.formData.entity_id) :''),
		type: isEdit ? 'POST' : 'PUT',
		contentType: null,
		data: JSON.stringify(data.formData),
		'processData': false,
		contentType: 'application/json',
		dataType: 'json',
		complete: function(response) {
			showMessage('success', object.charAt(0).toUpperCase() + object.slice(1) + ' succesfully '+ (data.formData.entity_id > 0 ? 'edited' : 'added') + '!')
			window[callback]();
		}
	});
}

function deleteRecord(object, data, field)
{
	$.ajax({
		url: apiURL + window[object+'URL'] + '/' + data.entity_id,
		type: 'DELETE',
		contentType: null,
		data: null,
		'processData': false,
		contentType: 'application/json',
		dataType: 'json',
		success: function(response) {
			showMessage('success', object.charAt(0).toUpperCase() + object.slice(1) + ' succesfully deleted');
		}
	});
}

function formatDate(date){
	var formattedDate = new Date("2016-04-02T20:40:41.000Z");
	var d = formattedDate.getDate();
	d = d>9 ? d : ('0' + d);
	var m =  formattedDate.getMonth();
	m = m>8 ? (m+1) : ('0' + (m+1));
	var y = formattedDate.getFullYear();

	return (d + "-" + m + "-" + y);
}

function addCustomAjaxHeader()
{
	//seems session expired
	if(!Cookies.get('bnb')){
		location.reload();
	}
	else{
		$.ajaxPrefilter(function( options ) {
			if ( !options.beforeSend) {
				options.beforeSend = function (xhr) { 
					xhr.setRequestHeader('x-token', $.parseJSON(Cookies.get("bnb")).token);
				}
			}
		});
	}
}

$( document ).ready(function() {
    socket.on('change', function (data) {
        dispatchSocketObject(data);
    });
	$("#login_password").keyup(function (e) {if (e.keyCode == 13) {login();}});
	if(backend){
	    $('[data-toggle="popover"]').popover({ trigger: "hover" });   
	}
	if(Cookies.get('bnb')){
		$('#login_text').html('Welcome back ' + $.parseJSON(Cookies.get('bnb')).name + '. <br />Loading the data will take just a bit...');
		$('#login_modal').modal('show');
		$('#navbar').append('<span class="logged_in navbar-brand">'+$.parseJSON(Cookies.get('bnb')).name+' <a href="javascript:void(0)" onclick="logout()">[logout]</a></span>');
		if($.parseJSON(Cookies.get('bnb')).role=='admin'){
			$('#settings_menu').show();
		}
		addCustomAjaxHeader();
		if(backend){
			$('#settings_content').fadeIn();
		}
		else{
			$('#index_content').fadeIn();
		}
		
		getAllData();
	}
	else{
		$('#login-modal').modal({
			backdrop: 'static',
			keyboard: true
		});
	}
});

function showMessage(type, message)
{
	$("#messages").show().removeClass().addClass('alert alert-'+type).text(message).delay(3000).fadeOut();
}

function addListButtons(objectType, addFunction)
{
	if($('#add_button_for_' + objectType).length > 0 || $('#back_button_for_' + objectType).length > 0)
	{
		return;
	}
	var parentId = '#' + objectType + '_list';
	$(parentId).append('<a id="back_button_for_'+objectType+'" href="javascript:void(0)" onclick="goToSettings()" class="btn btn-large btn-success"><i class="glyphicon glyphicon-backward"></i> &nbsp; Back to settings</a>');
	if(objectType != 'audit'){ 
		$(parentId).append('<button id="add_button_for_' + objectType + '" type="button" class="btn btn-primary" name="btn-save" onclick="' + addFunction + '"><span class="glyphicon glyphicon-plus"></span> Add new ' + objectType + '</button>');
	}
}

function goToSettings()
{
	$('.section').hide();
	$('table.settings').show();
}

function login()
{
	$.ajax({
		url: apiURL + '/login',
		type: 'POST',
		data: JSON.stringify({"username":$('#login_username').val(), "password":$('#login_password').val()}),
		contentType: 'application/json',
		dataType: 'json',
		complete: function(response) {
			if(response.responseJSON.token){
				$('#login-modal').fadeOut();
				$('.modal-backdrop').remove();
				if(backend){
					$('#settings_content').fadeIn();
				}
				else{
					$('#index_content').fadeIn();
				}
				if(!Cookies.get('bnb')){
					Cookies.set('bnb', {"token": response.responseJSON.token, "username":$('#login_username').val()}, { expires: 30 });
				}
				$('#login_text').text('Welcome ' + response.responseJSON.name+'.Loading the data will take just a bit...');
				$('#navbar').append('<span class="logged_in navbar-brand">'+response.responseJSON.name+' <a href="javascript:void(0)" onclick="logout()">[logout]</a></span>');
				$('#login_modal').modal('show'); 
				addCustomAjaxHeader();
				getAllData();
			}
			else{
				$('#text-login-msg').text(response.responseJSON.error).css('color', 'red');
			}
		}
	});
	return;
}

function getAllData()
{
	getRoles();
	getADUsers();
	
	
	if(backend){
		$('#cp2').colorpicker();	
	}
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function findRecord(objects, id)
{
	for(var z=0;z<objects.length;z++){
		if(objects[z]["Id"] == id){
			return z;
		}
	}
	return false;
}

//If a single property is returned, a delete socket was emitted
function checkIfDelete(data)
{
	var keys = [];
	$.each(data.records, function(key, value) {
	  keys.push(key)
	});
	return (keys.length == 1);
}

function dispatchSocketObject(data)
{
	var index = -1;
	var reRender = {};
	var deleted = data.action == 'delete';
	
	switch(data.type) {
		case 'device':
			console.log(data.records);
			if(data.action=='update'){
				index = findRecord(deviceTableModel.rows, data.records.entity_id);
			}
			console.log(index);
			if(index>=0){
				if(deleted){
					delete deviceTableModel.rows[index];
				}
				else{
					console.log('notify');
					notifyUser('Device state was changed!', 'Device ' + data.records.name + ' was changed to: '+stateObjects[data.records.current_state])
					deviceTableModel.rows[index] = getDeviceData(data.records);
				}
				
				
				var found = false;
				if(data.records.current_state){
					for(var z=0;z<requestTableModel.rows.length;z++){
						if(requestTableModel.rows[z]["Id"] == data.records.entity_id){
							found = z;
						}
					}
					if(openRequestStates.indexOf(data.records.current_state) >= 0)
					{
						if(!found){
							console.log('add new ');
							requestTableModel.rows.push(getDashboardOpenRequests(data.records));
							React.render(React.createElement(Table,requestTableModel), document.getElementById('open_request_list_content'));
						}
					}
					else{
						if(z){
							console.log('remove '+found);
							delete requestTableModel.rows[found]
							$('#open_request_list').find('td:first-child').filter(function() {return $(this).text() == data.records.name;}).parent().remove();
						}
					}
				}
				
			}
			else{
				deviceTableModel.rows.unshift(getDeviceData(data.records));
			}
			reRender.model=deviceTableModel;
			reRender.location=['device_list_content_index', 'device_list_content_settings'];
			break;
		case 'role':
			if(data.action=='update'){
				index = findRecord(roleTableModel.rows, data.records.entity_id);
			}
			if(index>=0){
				if(deleted){
					delete roleTableModel.rows[index];
				}
				else{
					roleTableModel.rows[index] = getRoleData(data.records);
				}
			}
			else{
				roleTableModel.rows.unshift(getRoleData(data.records));
			}
			reRender.model=roleTableModel;
			reRender.location=['roles_list_content'];
			break;
		case 'state':
			if(data.action=='update'){
				index = findRecord(stateTableModel.rows, data.records.entity_id);
			}
			if(index>=0){
				if(deleted){
					delete stateTableModel.rows[index];
					$("td:first-child").filter(function() {return $(this).text() == data.records.entity_id;}).parent().remove();
				}
				else{
					stateTableModel.rows[index] = getStateData(data.records);
				}
			}
			else{
				stateTableModel.rows.unshift(getStateData(data.records));
			}
			reRender.model=stateTableModel;
			reRender.location=['states_list_content'];
			break;
		case 'user':
			if(data.action=='update'){
				index = findRecord(userTableModel.rows, data.records.entity_id);
			}
			if(index>=0){
				if(deleted){
					delete userTableModel.rows[index];
				}
				else{
					userTableModel.rows[index] = getUserData(data.records);
				}
			}
			else{
				userTableModel.rows.unshift(getUserData(data.records));
			}
			reRender.model=userTableModel;
			reRender.location=['user_list_content'];
			break;
	}
	for(var loc=0;loc<reRender.location.length;loc++){
		React.render(React.createElement(Table,reRender.model), document.getElementById(reRender.location[loc]));
	}

	//fix for tr rendering
	setTimeout(function(){
		$('tr').each(function(index, element){
			if($(element).parent('tbody').length == 0 && $(element).siblings('tbody').length > 0){
				$(element).appendTo($(element).siblings('tbody').last());
			}
		});
	}, 500);
}

function logout()
{
	Cookies.remove('bnb');
	location.reload();
}

function generateStats()
{
	for (var i in deviceRequestStatData) {
		deviceRequestStatData[i]["label"] = deviceIdName[deviceRequestStatData[i]["label"]];
	}
	for (var i in userRequestStatData) {
		userRequestStatData[i]["label"] = getNameByAd(userObjects[userRequestStatData[i]["label"]]);
	}

jQuery('table.settings').hide();
jQuery('#statistics').show();


new Chart(document.getElementById("chart-area1").getContext("2d")).Pie(deviceRequestStatData);
new Chart(document.getElementById("chart-area2").getContext("2d")).Doughnut(userRequestStatData);
new Chart(document.getElementById("chart-area3").getContext("2d")).Line(timeRequestStatData, {});
new Chart(document.getElementById("chart-area4").getContext("2d")).Bar(newUsersStatData, {});
}

function notifyUser(title, message) {
    if ('Notification'  in window) {
        var options = {
            body: message,
            tag: 'preset',
            icon: 'https://avatars2.githubusercontent.com/u/17490894?v=3&s=460'
        };
        
        Notification.requestPermission(function() {
            var notification = new Notification(title,options);
            var sound = $('#notification-sound').get(0);
            if(sound) {
                sound.pause(); sound.currentTime = 0; sound.play();
            }
        });
    } else {
        console && console.info && console.info("[" + title + "]" +  message);
    }
}

function showConfig()
{
	jQuery('table.settings').hide();
	jQuery('#config_settings').show();
	jQuery('h1').text('Configuration settings');
	roleForm = React.createElement(JSONSchemaForm.default,{schema:configurationSchema, onSubmit: onConfigSubmit});
	ReactDOM.render(roleForm,document.getElementById('config_section'));
	addBackButton('showSetting');
}

function showSetting()
{
	jQuery('table.settings').show();
	jQuery('#config_settings').hide();
}

function submitConfigForm()
{

}

function loading(type, object)
{
	if(type=='start'){
		$('#welcome_body').append('<p id="loading_'+object+'">Loading '+object+'........</p>');
	}
	else{
		$('#loading_'+object).append('<span style="float:right">Done</span>');
		ajaxCalls--;
		if(ajaxCalls==0){
			$('#ready_button').show();
		}
	}
}

function go(location)
{
	backend=(location=='settings');
	$('.bnb_mode').hide();
	$('#'+location+'_mode').show();
}

function doSubmenu(type)
{
	go('settings');
	if(type!='showAbout'){
		$('.section').hide();
	}
	window[type]();

}

function showAbout()
{
	$('#about-modal').modal();
}