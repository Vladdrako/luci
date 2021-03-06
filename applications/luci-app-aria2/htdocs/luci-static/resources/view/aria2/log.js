'use strict';
'require dom';
'require fs';
'require poll';
'require uci';
'require view';

var css = '				\
#log_text {				\
	padding: 10px;			\
	text-align: left;		\
}					\
#log_text pre {				\
	padding: .5rem;			\
	word-break: break-all;		\
	margin: 0;			\
}					\
.description {				\
	background-color: #33ccff;	\
}					\
';

function pollLog(e) {
	return uci.load('aria2')
		.then(function() {
			var logFile = uci.get_first('aria2', 'aria2', 'log') || '/var/log/aria2.log';
			return Promise.all([
				fs.exec_direct('/usr/bin/tail', [ '-n', '50', logFile ]).then(function(res) { return res.trim().split(/\n/).reverse().join('\n') }),
				fs.exec_direct('/sbin/logread', [ '-e', 'aria2' ]).then(function(res) { return res.trim().split(/\n/).reverse().slice(0, 50).join('\n') })
			])
		}).then(function(data) {
			var t = E('pre', { 'wrap': 'pre' }, [
				E('div', { 'class': 'description' }, _('Last 50 lines of log file:')),
				E('br'),
				data[0] || _('No log data.'),
				E('br'),
				E('br'),
				E('div', { 'class': 'description' }, _('Last 50 lines of syslog:')),
				E('br'),
				data[1] || _('No log data.')
			]);
			dom.content(e, t);
		}).then(function() { uci.unload('aria2') });
};

return view.extend({
	render: function() {
		var node = E([], [
			E('style', [ css ]),
			E('div', {'class': 'cbi-map'}, [
			E('h2', {'name': 'content'}, '%s - %s'.format(_('Aria2'), _('Log Data'))),
			E('div', {'class': 'cbi-section'}, [
				E('div', { 'id': 'log_text' },
					E('img', {
						'src': LuCI.prototype.resource(['icons/loading.gif']),
						'alt': _('Loading'),
						'style': 'vertical-align:middle'
					}, _('Collecting data...'))
				),
				E('div', {'style': 'text-align:right'},
					E('small', {}, _('Refresh every %s seconds.').format(LuCI.prototype.env.pollinterval))
				)
			])
		])]);
		poll.add(pollLog.bind(this, node.querySelector('[id="log_text"]')));
		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
