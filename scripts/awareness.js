"use strict";

const MODULE_ID = "FoundryVTT-Circle-of-Awareness";
const MODULE_NAME = "Circle of Awareness";

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function updateAwareness(tokenConfig) {
	if (tokenConfig.object.getFlag(MODULE_ID, 'isAware')) {
		var awareness = tokenConfig.token._object.awarenessLight;
		awareness = awareness || new PointSource(tokenConfig.token._object);
		awareness.active = true;
		awareness.initialize(0, 0, 0, tokenConfig.object.getFlag(MODULE_ID, 'isAwareRadius') || 8, 0, 0, 0, 0, 1, {min: 0, max: 0}, CONST.SOURCE_TYPES.LOCAL, null, 0);
	} else {
		if (awareness) {
			awareness.active = false;
		}
	}
}

Hooks.on('renderTokenConfig', (tokenConfig, html, data) => {
	const tokenConfigElement = html[0];
	const vision = tokenConfigElement.querySelector('.tab[data-tab="vision"]');
	const isAware = tokenConfig.object.getFlag(MODULE_ID, 'isAware');
	const isAwareCheckboxElement = htmlToElement(`
		<div class="form-group">
			<label>Awareness</label>
			<input type="checkbox" name="${MODULE_ID}-is-aware" data-dtype="Boolean" ${isAware && 'checked'}>
		</div>`);
	vision.append(isAwareCheckboxElement);

	isAwareCheckboxElement.addEventListener('change', (ev) => {
		const isChecked = ev?.target?.checked || false;
		tokenConfig.object.setFlag(MODULE_ID, 'isAware', isChecked);
		updateAwareness(tokenConfig);
	});

	const isAwareRadius = tokenConfig.object.getFlag(MODULE_ID, 'isAwareRadius') || 8;
	const isAwareRadiusElement = htmlToElement(`
		<div class="form-group">
			<label>Awareness Radius</label>
			<input type="number" name="${MODULE_ID}-aware-radius" data-dtype="Number" value="${isAwareRadius}">
		</div>`);
	vision.append(isAwareRadiusElement);

	isAwareRadiusElement.addEventListener('change', (ev) => {
		const value = ev?.target?.value || 8;
		tokenConfig.object.setFlag(MODULE_ID, 'isAwareRadius', value);
		updateAwareness(tokenConfig);
	});
});

