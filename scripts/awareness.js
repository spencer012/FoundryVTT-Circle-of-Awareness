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
	console.log("Trying to update");
	console.log(tokenConfig);
	if (tokenConfig?.isAware || tokenConfig.object.getFlag(MODULE_ID, 'isAware')) {
		console.log("active");
		var awareness = tokenConfig.token._object.awarenessLight;
		awareness = awareness || new PointSource(tokenConfig.token._object, "sight");
		awareness.active = true;
		awareness.initialize({
			x: 0,
			y: 0,
			dim: tokenConfig?.isAwareRadius || tokenConfig.object.getFlag(MODULE_ID, 'isAwareRadius') || 8,
			bright: 0,
			angle: 0,
			rotation: 0,
			color: 0,
			alpha: 1,
			darkness: { min: 0, max: 1 },
			type: CONST.SOURCE_TYPES.LOCAL,
			animation: null,
			seed: 0
		});
	} else {
		console.log("unactive");
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
		tokenConfig.isAware = isChecked;
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
		tokenConfig.isAwareRadius = value;
		updateAwareness(tokenConfig);
	});
});

Hooks.on("init", () => {
	Token.prototype.updateSource = function updateSource({ defer = false, deleted = false, noUpdateFog = false } = {}) {
		if (CONFIG.debug.sight) {
			SightLayer._performance = { start: performance.now(), tests: 0, rays: 0 }
		}

		// Prepare some common data
		const origin = this.getSightOrigin();
		const sourceId = this.sourceId;
		const d = canvas.dimensions;

		// Update light source
		const isLightSource = this.emitsLight && !this.data.hidden;
		if (isLightSource && !deleted) {
			const bright = Math.min(this.getLightRadius(this.data.brightLight), d.maxR);
			const dim = Math.min(this.getLightRadius(this.data.dimLight), d.maxR);
			this.light.initialize({
				x: origin.x,
				y: origin.y,
				dim: dim,
				bright: bright,
				angle: this.data.lightAngle,
				rotation: this.data.rotation,
				color: this.data.lightColor,
				alpha: this.data.lightAlpha,
				animation: this.data.lightAnimation
			});
			canvas.lighting.sources.set(sourceId, this.light);
			if (!defer) {
				this.light.drawLight();
				this.light.drawColor();
			}
		}
		else {
			canvas.lighting.sources.delete(sourceId);
			if (isLightSource && !defer) canvas.lighting.refresh();
		}

		// Update vision source
		const isVisionSource = this._isVisionSource();
		if (isVisionSource && !deleted) {
			let dim = Math.min(this.getLightRadius(this.data.dimSight), d.maxR);
			const bright = Math.min(this.getLightRadius(this.data.brightSight), d.maxR);
			this.vision.initialize({
				x: origin.x,
				y: origin.y,
				dim: dim,
				bright: bright,
				angle: this.data.sightAngle,
				rotation: this.data.rotation
			});
			canvas.sight.sources.set(sourceId, this.vision);
			if (!defer) {
				this.vision.drawLight();
				canvas.sight.refresh({ noUpdateFog });
			}

			if (this.getFlag(MODULE_ID, 'isAware')) {
				let dim = Math.min(this.getLightRadius(this.getFlag(MODULE_ID, 'isAwareRadius')), d.maxR);
				this.vision.initialize({
					x: origin.x,
					y: origin.y,
					dim: dim,
					angle: 360
				});
				canvas.sight.sources.set(sourceId, this.vision);

				if (!defer) {
					this.vision.drawLight();
					canvas.sight.refresh({ noUpdateFog });
				}
			}
		}
		else {
			canvas.sight.sources.delete(sourceId);
			if (isVisionSource && !defer) canvas.sight.refresh();
		}
	}
});