/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */
var Configs = {
    SpecialChars: [',', '-', '/', '.', '(', ')', '*'],
    SplCharSeparator: '{SPL_CHAR}'
}
function isEmpty (value) {
    if (typeof value == 'string') {
        value = value.trim();
    } else if (typeof value == 'number') {
        value = String(value).trim();
    } else if (typeof value == 'object' && value !== null) { // JS treats null as an object
        if (value instanceof Date) {
            return false;
        }
        return Object.keys(value).length === 0;
    } else if (typeof value == 'boolean') {
        value = true;
    }
    return !Boolean(value);
}
Object.defineProperty(Array.prototype, 'removeEmptyValues', {
    enumerable: false,
    value: function () {
		for (var i = 0; i < this.length; i++) {
			if (isEmpty(this[i])) {
				this.splice(i, 1);
				i--;
			}
		}
		return this;
	}
});
Object.defineProperty(Array.prototype, 'groupBy', {
    enumerable: false,
    value: function (key) {
		if (!key) return this;
		var mapperObj = {};
		this.forEach(function (item) {
			(mapperObj[item[key]] = mapperObj[item[key]] || []).push(item);
		});
		return mapperObj;
	}
});

Ext.define('NLP.Application', {
    extend: 'Ext.app.Application',
    
    name: 'NLP',

    stores: [
        // TODO: add global / shared stores here
    ],
    
    launch: function () {

    }
});

Ext.Ajax.request({
    url: '../../Settings.json',
    async: false,
    success: function (response) {
        Configs = Ext.merge(Configs, Ext.decode(response.responseText));
        Configs.Service = 'http://localhost:' + Configs.PyPort;
    }
});