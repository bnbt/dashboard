var auditURL = '/audit';
var deviceRequestStatData = {};
var userRequestStatData = {};
var timeRequestStatData = {
	labels:["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	datasets: [{
            label: "Device Usage",
            fillColor: "rgba(220,220,220,0.2)",
            strokeColor: "rgba(220,220,220,1)",
            pointColor: "rgba(220,220,220,1)",
            pointStrokeColor: "#fff",
            pointHighlightFill: "#fff",
            pointHighlightStroke: "rgba(220,220,220,1)",
            data: [0,0,0,0,0,0,0,0,0,0,0,0]
        }
	]
};
var newUsersStatData = {
    labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    datasets: [
        {
            label: "New user registration",
            fillColor: "rgba(220,220,220,0.5)",
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [0,0,0,0,0,0,0,0,0,0,0,0]
        }
    ]
};
var d = new Date();
var monthNames = [
];

var auditTableModel = {
	cols: ["Id", "Request date", "User", "RFID", "Device", "State"],
	rows: [],
	title: 'Audits',
	divid: 'audit_list'
}

function showAuditList()
{
	jQuery('#audit_settings').show();
	jQuery('table.settings').hide();
	jQuery('#audit_section').hide();
	jQuery('#audit_list').show();
	jQuery('#add_audit').show();
	jQuery('h1').text('Audits');
	React.render(React.createElement(Table,auditTableModel), document.getElementById('audit_list_content'));
	addListButtons('audit', 'showAuditForm(null)');
	
}

function getAudits()
{
	loading('start','audit');
	$.getJSON(apiURL + auditURL+'?t='+$.now(), function(result){
		for(i=0;i<result.length;i++){
			addStatData(result[i]);
			
			if(backend || (!backend && i<10)){
				auditTableModel.rows.push(getAuditObject(result[i]));
			}
	   }
		loading('end','audit');
		//getStates();
		React.render(React.createElement(Table,auditTableModel), document.getElementById('audits_list_content'));
	});
}

function getAuditObject(obj)
{
	return {
		"Id": obj.entity_id,
		"Request date": formatDate(obj.request_date),
		"User": obj.user && obj.user.user_AD && ADUsers[obj.user.user_AD] ? ADUsers[obj.user.user_AD].name : (obj.user && obj.user.user_AD ? obj.user.user_AD : 'N/A'),
		"RFID": obj.rfid,
		"Device": deviceIdName[obj.device_id],
		"State": obj.state.state_name,
	};
}

function addStatData(obj)
{
	if(deviceRequestStatData[obj["device_id"]])
	{
		deviceRequestStatData[obj["device_id"]]["value"] += 1;
	}
	else{
		deviceRequestStatData[obj["device_id"]] = {
			value: 1,
			color:'#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6),
			highlight: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6),
			label: obj["device_id"]
		}
	}
	
	if(obj["user_id"] && userRequestStatData[obj["user_id"]])
	{
		userRequestStatData[obj["user_id"]]["value"] += 1;
	}
	else{
		userRequestStatData[obj["user_id"]] = {
			value: 1,
			color:'#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6),
			highlight: '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6),
			label: obj["user_id"]
		}
	}
	
	timeRequestStatData.datasets[0]["data"][new Date(obj["request_date"]).getMonth()] += 1;
}