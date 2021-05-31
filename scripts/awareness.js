"use strict";

const MODULE_ID = "FoundryVTT-Circle-of-Awareness";

Hooks.on('renderTokenConfig', (app, html, data) => {
	console.log(app);
	console.log(html);
	console.log(data);
	console.log("------");
	const selector = html.find('header:contains(Vision)').nextAll('header')[0];
	console.log(selector);
});